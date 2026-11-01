# 把项目上传至 GitHub

当前完整项目：`C:\Users\ASUS\Documents\ChatGPT\AI PM\stadium-journal`。本项目已使用 Git；网站发布系统使用现有的 `origin` 远程。

## 上传现有项目

1. 登录 GitHub，点击 New repository，名称可用 `stadium-journal`。建议选 **Private**，不勾选初始化 README、.gitignore 或 License。资料和媒体有各自授权，本项目尚未整理为可公开分发的开源项目。
2. 在项目目录打开 PowerShell，运行以下命令。把 URL 的 `YOUR_USERNAME` 改成自己的 GitHub 用户名；按提示登录 GitHub。

```powershell
cd "C:\Users\ASUS\Documents\ChatGPT\AI PM\stadium-journal"
git remote add github https://github.com/YOUR_USERNAME/stadium-journal.git
git push github HEAD:main
```

保留 `origin`；`github` 是额外的备份远程。这条 push 不改变现有分支的上游配置。后续网站修改已提交后，再执行 `git push github HEAD:main` 更新 GitHub。

如果同名远程已存在，用 `git remote get-url github` 查看其地址；需要修正时使用 `git remote set-url github <正确的仓库URL>`。

## 从源码 ZIP 建立独立仓库

运行 `python scripts/export-source.py` 会在项目旁生成 `stadium-journal-source.zip`，包含当前源码、资源、文档与脚本，不含 `.git` 历史、研究缓存、浏览器记录或临时输出。

解压到另一个目录后，可用 GitHub Desktop 选择 File → Add local repository；若提示还不是仓库，按提示创建，再 Publish repository，勾选 Keep this code private。也可在解压目录运行：

```powershell
git init -b main
git add .
git commit -m "Initial project"
git remote add origin https://github.com/YOUR_USERNAME/stadium-journal.git
git push -u origin main
```

ZIP 解压目录拥有独立的 Git 历史；本机原项目继续负责现有网站的发布。

## 本地运行

安装 Node.js 后在项目根目录运行 `npm run dev`，打开 `http://127.0.0.1:4173/`。应用无需安装 npm 依赖。使用 `npm run check` 验证内容与脚本。作者模型和球队音频仍需访问其原发布方网络。

## 公开之前

Football-Data.co.uk 数据限定私人个人用途；照片、音频及作者模型的署名和许可各不相同。当前包是项目源码备份，不附赠第三方内容的再分发许可。公开仓库前应取得适用授权，或移除/替换受限资料。详见 `docs/data-methodology.md`、`dist/assets/credits.json`、`city-credits.json`、`audio-tracks.js` 与 `detailed-models.js`。没有为整个项目添加覆盖第三方资产的开源许可证。

参考：[GitHub 官方：将本地代码添加到 GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)。
