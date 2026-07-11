# BeautyCam JP KOL Dashboard

日本 BeautyCam 达人合作资源库看板。

## 同事访问方式（固定网址）

本项目需要部署到云端后，才有像韩国版那样的**固定公网链接**（不依赖某台电脑是否开机）。

完整步骤见：[DEPLOY.md](./DEPLOY.md)

部署完成后，同事只需：

1. 打开 `https://xxxx.up.railway.app`（你生成的固定域名）
2. 输入统一账号密码登录

## 本地开发

```bash
npm install
npx prisma db push
npm run dev
```

打开 http://localhost:3000

## 登录配置（.env）

```env
AUTH_USERNAME=admin
AUTH_PASSWORD=your-password
AUTH_SECRET=long-random-string
DATABASE_URL="file:./prisma/dev.db"
```
