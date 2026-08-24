#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const results = [];

function add(level, name, detail) {
  results.push({ level, name, detail });
}

function pass(name, detail = '') { add('PASS', name, detail); }
function warn(name, detail = '') { add('WARN', name, detail); }
function fail(name, detail = '') { add('FAIL', name, detail); }

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

function normalize(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/^\//, '');
}

function bytesLabel(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function checkProjectConfiguration() {
  let project;
  let app;
  try {
    project = readJson('project.config.json');
    app = readJson('miniprogram/app.json');
    pass('JSON 配置可解析', 'project.config.json、miniprogram/app.json');
  } catch (error) {
    fail('JSON 配置可解析', error.message);
    return;
  }

  project.miniprogramRoot === 'miniprogram/'
    ? pass('小程序根目录', project.miniprogramRoot)
    : fail('小程序根目录', `当前值：${project.miniprogramRoot || '未设置'}`);
  project.cloudfunctionRoot === 'cloudfunctions/'
    ? pass('云函数根目录', project.cloudfunctionRoot)
    : fail('云函数根目录', `当前值：${project.cloudfunctionRoot || '未设置'}`);
  /^wx[a-f0-9]{16}$/.test(project.appid || '')
    ? pass('AppID 格式', project.appid)
    : fail('AppID 格式', '未配置有效微信小程序 AppID');
  project.libVersion
    ? pass('基础库版本', project.libVersion)
    : warn('基础库版本', '建议固定参赛演示使用的基础库版本');

  const subpackagePages = (app.subPackages || []).flatMap(pkg =>
    (pkg.pages || []).map(page => `${pkg.root}/${page}`)
  );
  const registeredPages = [...(app.pages || []), ...subpackagePages];
  const extensions = ['.js', '.json', '.wxml', '.wxss'];
  const missingPageFiles = [];
  for (const page of registeredPages) {
    for (const extension of extensions) {
      const file = path.join(ROOT, 'miniprogram', `${page}${extension}`);
      if (!fs.existsSync(file)) missingPageFiles.push(normalize(path.relative(ROOT, file)));
    }
  }
  missingPageFiles.length === 0
    ? pass('页面注册与四件套完整', `${registeredPages.length} 个页面（含 ${subpackagePages.length} 个分包页面）`)
    : fail('页面注册与四件套完整', missingPageFiles.join('、'));

  if (app.permission && app.permission['scope.userLocation'] &&
      Array.isArray(app.requiredPrivateInfos) && app.requiredPrivateInfos.includes('getLocation')) {
    pass('定位隐私声明', 'scope.userLocation + requiredPrivateInfos');
  } else {
    fail('定位隐私声明', '导航使用定位，app.json 必须声明用途');
  }
}

function checkCloudFunctions() {
  const expected = ['contentService', 'visitorRecords', 'contentAdmin'];
  const missing = [];
  for (const name of expected) {
    for (const filename of ['index.js', 'package.json', 'config.json']) {
      const relative = `cloudfunctions/${name}/${filename}`;
      if (!fs.existsSync(path.join(ROOT, relative))) missing.push(relative);
    }
  }
  missing.length === 0
    ? pass('核心云函数文件完整', expected.join('、'))
    : fail('核心云函数文件完整', missing.join('、'));

  const envSource = fs.readFileSync(path.join(ROOT, 'miniprogram/config/env.js'), 'utf8');
  const defaultMatch = envSource.match(/DEFAULT_ENV_ID\s*=\s*['"]([^'"]*)['"]/);
  if (defaultMatch && defaultMatch[1].trim()) {
    pass('默认云环境 ID 已配置', defaultMatch[1].trim());
  } else {
    warn('默认云环境 ID 未配置', '本地演示前可用 wx.setStorageSync 写入；正式上传前建议填写 DEFAULT_ENV_ID');
  }
}

function checkCoordinatesAndAssets() {
  let data;
  try {
    data = require(path.join(ROOT, 'miniprogram/utils/data.js'));
  } catch (error) {
    fail('业务数据可加载', error.message);
    return;
  }
  pass('业务数据可加载');

  const qiaolin = data.redVillages.find(item => item.id === 'village_1');
  const reservoir = data.mapPlaces.find(item => item.id === 'place_qiaolin_reservoir');
  const exact = (item, latitude, longitude) => item &&
    Number(item.latitude) === latitude && Number(item.longitude) === longitude;
  exact(qiaolin, 26.620306, 114.046347)
    ? pass('乔林村腾讯地图坐标', '26.620306, 114.046347')
    : fail('乔林村腾讯地图坐标', '坐标与已核准分享位置不一致');
  exact(reservoir, 26.619332, 114.046397)
    ? pass('乔林水库可达入口坐标', '26.619332, 114.046397')
    : fail('乔林水库可达入口坐标', '坐标与已核准分享位置不一致');

  const requiredAssets = [];
  for (const item of [...data.redLandmarks, ...data.redVillages, ...data.mapPlaces]) {
    if (item.iconPath) requiredAssets.push(item.iconPath);
  }
  for (const photo of data.photoGallery.filter(item => item.available)) {
    requiredAssets.push(photo.src);
  }
  for (const story of data.redStories.filter(item => item.audioAvailable)) {
    requiredAssets.push(story.audio);
  }
  const missing = [...new Set(requiredAssets)].filter(asset =>
    !fs.existsSync(path.join(ROOT, 'miniprogram', normalize(asset)))
  );
  missing.length === 0
    ? pass('已启用本地素材完整', `${new Set(requiredAssets).size} 个引用`)
    : fail('已启用本地素材完整', missing.join('、'));

  const availablePhotos = data.photoGallery.filter(item => item.available).length;
  const placeholders = data.photoGallery.length - availablePhotos;
  pass('实拍图片入库', `${availablePhotos} 张可展示`);
  placeholders > 0
    ? warn('相册占位条目', `${placeholders} 条尚无实拍图片，页面已禁止空白预览`)
    : pass('相册占位条目', '无');
}

function checkPackageSize() {
  const project = readJson('project.config.json');
  const app = readJson('miniprogram/app.json');
  const miniRoot = path.join(ROOT, 'miniprogram');
  const ignored = new Set(((project.packOptions && project.packOptions.ignore) || [])
    .filter(item => item.type === 'file')
    .map(item => normalize(item.value)));
  const subpackageRoots = (app.subPackages || []).map(pkg => normalize(pkg.root).replace(/\/$/, ''));
  const files = walkFiles(miniRoot);
  const included = [];
  for (const file of files) {
    const relative = normalize(path.relative(miniRoot, file));
    if (ignored.has(relative)) continue;
    const size = fs.statSync(file).size;
    included.push({ relative, size });
  }

  const belongsToRoot = (relative, root) => relative === root || relative.startsWith(`${root}/`);
  const mainFiles = included.filter(item => !subpackageRoots.some(root => belongsToRoot(item.relative, root)));
  const mainTotal = mainFiles.reduce((sum, item) => sum + item.size, 0);
  const packageTarget = 2 * 1024 * 1024;
  mainTotal <= packageTarget
    ? pass('主包静态体积预估', `${bytesLabel(mainTotal)}，不含分包及工具二次处理`)
    : fail('主包静态体积预估', `${bytesLabel(mainTotal)}，超过 2 MB 目标`);

  for (const root of subpackageRoots) {
    const packageFiles = included.filter(item => belongsToRoot(item.relative, root));
    const packageTotal = packageFiles.reduce((sum, item) => sum + item.size, 0);
    packageTotal <= packageTarget
      ? pass(`分包体积预估（${root}）`, bytesLabel(packageTotal))
      : fail(`分包体积预估（${root}）`, `${bytesLabel(packageTotal)}，超过 2 MB 目标`);
  }

  const total = included.reduce((sum, item) => sum + item.size, 0);
  total <= 20 * 1024 * 1024
    ? pass('小程序总体积预估', bytesLabel(total))
    : fail('小程序总体积预估', `${bytesLabel(total)}，超过 20 MB 目标`);

  const largest = mainFiles.sort((a, b) => b.size - a.size).slice(0, 3)
    .map(item => `${item.relative} ${(item.size / 1024).toFixed(0)} KB`).join('；');
  pass('主包最大文件记录', largest);
}

function checkSensitiveContent() {
  let tracked = [];
  try {
    tracked = execFileSync('git', [
      '-c', `safe.directory=${normalize(ROOT)}`,
      'ls-files', '-z'
    ], { cwd: ROOT }).toString('utf8').split('\0').filter(Boolean);
  } catch (error) {
    warn('Git 敏感信息扫描', `无法读取已跟踪文件：${error.message}`);
    return;
  }

  const binaryExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.mp4', '.pdf', '.p12', '.pfx']);
  const signatures = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /\bghp_[A-Za-z0-9]{30,}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\bAKID[A-Za-z0-9]{12,}\b/
  ];
  const hits = [];
  for (const relative of tracked) {
    if (binaryExtensions.has(path.extname(relative).toLowerCase())) continue;
    const fullPath = path.join(ROOT, relative);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size > 2 * 1024 * 1024) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    if (signatures.some(pattern => pattern.test(content))) hits.push(normalize(relative));
  }
  hits.length === 0
    ? pass('已跟踪文件强特征密钥扫描', `${tracked.length} 个 Git 文件`)
    : fail('已跟踪文件强特征密钥扫描', hits.join('、'));

  const forbidden = tracked.filter(relative => /(^|\/)(project\.private\.config\.json|\.env(?:\..*)?|.*\.codex-backup)$/i.test(normalize(relative)));
  forbidden.length === 0
    ? pass('本机私有文件未入库')
    : fail('本机私有文件未入库', forbidden.join('、'));
}

function checkCompetitionArtifacts() {
  const artifacts = [
    ['output/pdf/红韵乔林-产品设计说明书.pdf', '产品设计说明书 PDF'],
    ['output/pdf/红韵乔林-开发过程与测试报告.pdf', '开发过程与测试报告 PDF']
  ];
  for (const [relative, label] of artifacts) {
    const fullPath = path.join(ROOT, relative);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 10 * 1024) {
      pass(label, bytesLabel(fs.statSync(fullPath).size));
    } else {
      fail(label, '文件不存在或异常过小');
    }
  }
  const videos = walkFiles(ROOT).filter(file => /\.(mp4|mov)$/i.test(file));
  videos.length > 0
    ? pass('演示视频文件', videos.map(file => normalize(path.relative(ROOT, file))).join('、'))
    : warn('演示视频文件', '尚未放入 3–5 分钟 1080p MP4 成片');
  warn('体验码与真机验收', '必须在微信开发者工具开启服务端口后完成编译、预览、真机定位和云函数验证');
}

checkProjectConfiguration();
checkCloudFunctions();
checkCoordinatesAndAssets();
checkPackageSize();
checkSensitiveContent();
checkCompetitionArtifacts();

const order = { FAIL: 0, WARN: 1, PASS: 2 };
for (const item of results.sort((a, b) => order[a.level] - order[b.level])) {
  console.log(`[${item.level}] ${item.name}${item.detail ? `：${item.detail}` : ''}`);
}

const counts = results.reduce((summary, item) => {
  summary[item.level] += 1;
  return summary;
}, { PASS: 0, WARN: 0, FAIL: 0 });
console.log(`\n汇总：${counts.PASS} PASS / ${counts.WARN} WARN / ${counts.FAIL} FAIL`);
process.exitCode = counts.FAIL > 0 ? 1 : 0;
