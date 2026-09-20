# 红韵乔林团队协作

每个人在自己的电脑和功能分支开发，使用 Pull Request 合并到 `main`。先在任务群约定负责的页面和公共文件；本说明是协作约定，不代表 GitHub 已设置强制分支保护。

## 第一次加入

接受 GitHub 仓库邀请后运行：

```bash
git clone https://github.com/yk070331/2026Sanxiaxiang.git
cd 2026Sanxiaxiang
git switch -c feature/your-task
```

将 `your-task` 替换成任务名称，例如 `story-content`。微信开发者工具导入仓库根目录（包含 `project.config.json`），不要导入外层下载目录。使用项目 AppID 需要相应微信开发权限；自己的测试号和个人环境配置不要混入提交。

## 开始新任务

先提交或妥善保存已有修改，再更新主分支：

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/another-task
```

正在开发的功能分支需要吸收他人更新时，先提交当前修改，然后运行 `git fetch origin` 和 `git merge origin/main`。出现冲突时核对双方意图，解决并重新测试，不要强制推送或直接覆盖同学的文件。

## 提交与合并

1. 仅暂存本任务的文件，例如 `git add miniprogram/pages/red-stories/`。
2. `git commit -m "说明本次改动"`。
3. `git push -u origin feature/your-task`。
4. 在 GitHub 发起合并到 `main` 的 Pull Request，说明改了什么、如何测试，界面改动附截图。
5. 项目负责人检查后合并，其他人再拉取最新代码。

## 文件分工建议

| 功能 | 主要目录 |
| --- | --- |
| 首页地图与快捷入口 | `miniprogram/pages/index/` |
| 红色故事 | `miniprogram/pages/red-stories/` |
| 路线与研学打卡 | `miniprogram/pages/route-recommend/`、`miniprogram/pages/study-tour/` |
| 实景相册 | `miniprogram/assets/gallery/` |
| 知识闯关 | `miniprogram/pages/knowledge-quiz/` |

`miniprogram/utils/data.js`、`miniprogram/app.json`、`miniprogram/app.wxss`、云函数与公共工具需要协调修改。保持未核验史料提示、距离待实测说明及未核验坐标导航拦截；真实录音未采集时不可标为可播放。

## 提交前检查（PowerShell）

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "测试失败：$($_.Name)" }
}
node scripts/release-readiness.js
```

再用开发者工具编译并体验受影响的页面。云端、定位、扫码和相册权限的本地测试不能替代手机验证。
