const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const miniRoot = path.join(root, 'miniprogram');

function walk(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, result);
    else result.push(fullPath);
  }
  return result;
}

const sourceFiles = [
  ...walk(miniRoot),
  ...walk(path.join(root, 'cloudfunctions'))
];

for (const file of sourceFiles.filter(item => item.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotThrow(
    () => new vm.Script(source, { filename: file }),
    `JavaScript syntax error: ${path.relative(root, file)}`
  );
}

for (const file of sourceFiles.filter(item => item.endsWith('.json'))) {
  assert.doesNotThrow(
    () => JSON.parse(fs.readFileSync(file, 'utf8')),
    `JSON syntax error: ${path.relative(root, file)}`
  );
}

const appConfig = JSON.parse(fs.readFileSync(path.join(miniRoot, 'app.json'), 'utf8'));
assert(appConfig.pages.includes('pages/admin/index'), 'admin page must be registered');
const subpackagePages = (appConfig.subPackages || []).flatMap(pkg =>
  (pkg.pages || []).map(page => `${pkg.root}/${page}`)
);
const registeredPages = [...appConfig.pages, ...subpackagePages];
assert(subpackagePages.includes('assets/gallery/index'), 'gallery must be registered in assets subpackage');

for (const page of registeredPages) {
  const base = path.join(miniRoot, page);
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    assert(fs.existsSync(`${base}${extension}`), `missing page file: ${page}${extension}`);
  }

  const jsSource = fs.readFileSync(`${base}.js`, 'utf8');
  const wxmlSource = fs.readFileSync(`${base}.wxml`, 'utf8');
  const eventPattern = /(?:bind|catch)[a-zA-Z:]+="([a-zA-Z_$][\w$]*)"/g;
  let match;
  while ((match = eventPattern.exec(wxmlSource))) {
    const handler = match[1];
    assert(
      new RegExp(`\\b${handler}\\s*\\(`).test(jsSource),
      `${page}.wxml references missing handler ${handler}`
    );
  }
}

const allFileNames = walk(root).map(file => path.basename(file));
assert(!allFileNames.some(name => name.endsWith('.codex-backup')), 'temporary backup file remains');

const tourSource = fs.readFileSync(
  path.join(miniRoot, 'pages', 'study-tour', 'index.js'),
  'utf8'
);
assert(!tourSource.includes('水面中心'), 'reservoir navigation still describes a water-center coordinate');
assert(tourSource.includes('可到达入口/大坝'), 'reachable reservoir entrance wording is missing');
assert(tourSource.includes('syncCheckIn'), 'study tour is not connected to visitor sync');

const gallerySource = fs.readFileSync(
  path.join(miniRoot, 'assets', 'gallery', 'index.js'),
  'utf8'
);
assert(gallerySource.includes('getPhotoGallery'), 'photo gallery is not connected to published content');

const { redVillages, mapPlaces } = require(path.join(miniRoot, 'utils', 'data.js'));
const qiaolin = redVillages.find(item => item.id === 'village_1');
const reservoir = mapPlaces.find(item => item.id === 'place_qiaolin_reservoir');
assert.deepStrictEqual(
  [qiaolin.latitude, qiaolin.longitude],
  [26.620306, 114.046347],
  'Qiaolin Village coordinate must match Tencent Maps share link'
);
assert.deepStrictEqual(
  [reservoir.latitude, reservoir.longitude],
  [26.619332, 114.046397],
  'Qiaolin Reservoir entrance coordinate must match Tencent Maps share link'
);

console.log(`staticPages.test.js: ${sourceFiles.length} source files checked, all tests passed`);
