# 红韵乔林 - 井冈山红色文旅与研学小程序

“红韵乔林”是面向红色乡村游客、学校研学团队和村级资料管理者的微信小程序。项目以井冈山市茅坪镇乔林村为试点，把真实地图导航、红色故事、实景影像、文物史实、个性化路线、扫码打卡、知识闯关、游客纠错和资料审核整合为可持续维护的数字服务。

项目参加2026年山东省大学生软件设计大赛“软件开发”赛题，定位为方向三：传统软件应用开发。

## 当前核心能力

- 全域地图、点位搜索、类别筛选、当前位置与腾讯地图导航。
- 乔林村委会/游客入口、乔林水库可达入口/大坝使用腾讯地图核验坐标。
- 30分钟初心线、60分钟研学线、半日乡村线三套可解释路线推荐。
- 红色故事、实景相册、文物史实分类和微信原生大图预览。
- 手动打卡与二维码打卡、本地进度、云端同步及弱网补传。
- 5道带解释和资料来源的红色知识闯关。
- 游客纠错、离线保存、联网补传与后台待处理记录。
- 村级录入员、实践团队管理员、审核员三级资料审核流程。
- 云端只读取已发布内容；云服务未配置或初始化失败时自动回退本地已审核数据。
- 关怀模式、定位拒绝提示、无效二维码提示和未核验坐标保护。

## 已核验地图位置

| 点位 | GCJ-02 纬度 | GCJ-02 经度 | 来源 |
| --- | ---: | ---: | --- |
| 乔林村委会/游客入口 | 26.620306 | 114.046347 | 腾讯地图分享位置 |
| 乔林水库可达入口/大坝 | 26.619332 | 114.046397 | 腾讯地图分享位置 |

村内六处旧址仍需逐点取得腾讯地图分享位置或现场采集坐标。在核验完成前，小程序不会用推测坐标提供导航或虚构路线连线。

## 参赛文档

- [产品设计说明书](output/pdf/红韵乔林-产品设计说明书.pdf)
- [开发过程与测试报告](output/pdf/红韵乔林-开发过程与测试报告.pdf)
- [山东省软件大赛参赛基线](山东省软件大赛参赛基线.md)
- [发布前检查与微信开发者工具说明](参赛材料/发布前检查与微信开发者工具说明.md)
- [参赛材料目录](参赛材料/)

PDF 可通过以下命令重复生成和校验：

```powershell
python scripts/run_pdf_generation.py
python scripts/render_pdf_pages.py
python scripts/verify_competition_pdfs.py
```

## 项目结构

```text
miniprogram/
  config/
    env.js              云环境本机覆盖与默认值
  pages/
    index/              首页地图
    village-detail/     村落详情
    site-detail/        旧址详情与纠错入口
    photo-gallery/      实景相册与文物史实
    route-recommend/    个性化路线推荐
    study-tour/         导航、扫码与打卡
    knowledge-quiz/     红色知识闯关
    correction/         游客纠错
    admin/              资料录入与审核
  utils/
    data.js             本地已审核核心数据
    contentService.js   云端内容读取与本地降级
    visitorSync.js      打卡离线同步
    correctionService.js 纠错离线同步
cloudfunctions/
  contentService/       已发布内容白名单读取
  visitorRecords/       打卡与纠错
  contentAdmin/         角色权限与审核发布
tests/                  自动化与静态回归测试
参赛材料/               需求、架构、数据库、合规、演示资料
output/pdf/             正式参赛PDF
scripts/                PDF工具与发布体检脚本
```

## 本地运行

1. 使用微信开发者工具导入仓库根目录。
2. AppID 当前配置为 `wxdc2fcf76559c970f`；无权限时请换成自己的测试号。
3. 未配置云环境也可以浏览本地内容、图片、路线并完成本地打卡。
4. 需要云端功能时，在 `miniprogram/config/env.js` 填写 `DEFAULT_ENV_ID`；也可在调试器执行 `wx.setStorageSync('qiaolinCloudEnvId', '你的云环境ID')` 仅供本机使用。
5. 上传并部署 `contentService`、`visitorRecords`、`contentAdmin` 三个云函数。
6. 按 [管理后台部署与权限说明](参赛材料/管理后台部署与权限说明.md) 创建集合并配置 `adminRoles`。

## 自动化测试与发布体检

```powershell
node tests/cloudfunctions.test.js
node tests/visitorSync.test.js
node tests/correctionService.test.js
node tests/quizData.test.js
node tests/appCloudInit.test.js
node tests/staticPages.test.js
node scripts/release-readiness.js
```

发布体检会自动检查页面、云函数、腾讯坐标、本地素材、包体预估、强特征密钥、私人文件和参赛材料。`FAIL` 必须修复；`WARN` 表示仍需在提交前完成的人工或外部条件。

## 当前证据边界

已经完成本地功能实现、云函数逻辑测试、页面静态回归、地图分享位置核对、云环境启动容错、发布体检和正式参赛PDF生成。提交体验版前仍需完成：

- 在微信开发者工具开启服务端口后进行真实编译、预览与包体检查。
- 微信云环境部署及三个角色账号的权限验证。
- Android和iOS真机定位、导航、扫码及弱网测试。
- 六处旧址逐点坐标核验。
- 实拍照片、人物照片和文物史料公开授权记录。
- 真人语音讲解、体验码、3–5分钟演示视频和实地用户反馈。

未经核验的史料不会作为确定事实发布；AI修复或生成素材必须明确标注，不能冒充原始史料。
