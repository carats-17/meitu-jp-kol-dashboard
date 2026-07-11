# 固定网址部署（不依赖你的电脑）

不要用 Railway 的话，推荐下面两个（任选一个）。

---

## 方案 A：Zeabur（推荐，操作最简单）

适合不想折腾的人，界面相对直观。

1. 打开 https://zeabur.com ，用 **GitHub** 登录  
2. **Deploy New Project** → 选仓库 `carats-17/meitu-jp-kol-dashboard`  
3. 选 **Hong Kong / Singapore** 区域  
4. 等构建完成，Zeabur 会自动给一个固定域名  
5. 在服务 **Variables** 里添加：

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | `file:/data/prod.db`（若平台提示用别的路径，按其文档） |
| `AUTH_USERNAME` | `admin` |
| `AUTH_PASSWORD` | 你们的密码 |
| `AUTH_SECRET` | 任意长字符串 |

6. 打开 Zeabur 给你的 `https://xxxx.zeabur.app`，登录使用  

若 Zeabur 对 SQLite 路径有特殊要求，把报错发我即可改。

---

## 方案 B：Render（国外常用，稳定）

1. 打开 https://dashboard.render.com ，用 **GitHub** 登录  
2. **New +** → **Blueprint** → 选这个仓库（会读 `render.yaml`）  
   或 **New +** → **Web Service** → 选仓库  
3. 若手填 Web Service：
   - **Build Command**  
     `npm ci && npx prisma generate && DATABASE_URL="file:./prisma/build.db" npx prisma db push --skip-generate && npm run build`
   - **Start Command**  
     `npx prisma db push --skip-generate && npx next start -H 0.0.0.0 -p $PORT`
4. 添加环境变量（同上表）  
5. 添加 **Persistent Disk**，挂载路径 `/data`  
6. 选 **Starter** 方案（免费版会休眠，不满足「随时可开」）  
7. 部署成功后得到：`https://xxxx.onrender.com`

---

## 方案 C：Vercel（Next.js 最顺，但要换数据库）

Vercel 不能可靠使用本机 SQLite 文件，需要再接云数据库（如 Turso）。  
若你选这个，告诉我，我帮你改数据库配置。

---

## 对比

| | 固定网址 | 是否要电脑开机 | 难度 |
|--|----------|----------------|------|
| Zeabur | ✅ `*.zeabur.app` | ❌ 不需要 | 低 |
| Render | ✅ `*.onrender.com` | ❌ 不需要 | 中 |
| Vercel | ✅ `*.vercel.app` | ❌ 不需要 | 中（要改库） |
| Railway | ✅ | ❌ 不需要 | 你已踩坑，可弃用 |

---

部署好后把固定链接发我，我帮你看登录页是否正常。
