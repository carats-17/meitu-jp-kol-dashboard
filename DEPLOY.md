# 最简单上线方式（公司网打不开 Render / Railway 时用这个）

目标：固定网址 `https://xxx.vercel.app`，电脑关机也能用。  
只用 **手机流量** 完成注册（不要用公司 Wi‑Fi）。

---

## 一共 3 步

### ① 手机建数据库（Turso，免费）

1. 手机关掉公司 Wi‑Fi，用流量打开：https://turso.tech  
2. 用 **GitHub** 登录  
3. 新建数据库，名字例如：`beautycam-jp-kol`  
4. 复制两样东西（后面要填）：
   - **Database URL**（`libsql://...` 开头）
   - **Auth Token**

### ② 手机打开 Vercel 导入项目

1. 手机流量打开：https://vercel.com  
2. **Continue with GitHub** → 选仓库 `meitu-jp-kol-dashboard`  
3. 点 **Import** / **Deploy** 前，先加环境变量：

| Name | Value |
|------|--------|
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `TURSO_DATABASE_URL` | ① 里复制的 `libsql://...` |
| `TURSO_AUTH_TOKEN` | ① 里复制的 Token |
| `AUTH_USERNAME` | `admin` |
| `AUTH_PASSWORD` | 你们的密码 |
| `AUTH_SECRET` | `beautycam-jp-kol-secret-2026` |

4. 点 Deploy，等成功  
5. 得到固定链接：`https://xxxx.vercel.app`

### ③ 初始化表结构（电脑终端跑一次）

公司电脑终端执行（把下面两行换成你的真实值）：

```bash
cd ~/Projects/meitu-jp-kol-dashboard
export TURSO_DATABASE_URL="libsql://你的地址.turso.io"
export TURSO_AUTH_TOKEN="你的token"
export DATABASE_URL="$TURSO_DATABASE_URL"
npx prisma db push
```

然后打开 Vercel 网址 → 用 admin + 密码登录。

---

## 以后更新

本地改代码 → `git push` → Vercel 自动重新部署。  
不用再打开 Render / Railway / Zeabur。

---

## 为什么不用 Render

你公司网络打不开 Render 控制台。  
Vercel + 手机流量授权一次即可，之后只靠 GitHub。
