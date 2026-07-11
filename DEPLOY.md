# 固定公网网址部署（不依赖你的电脑是否开机）

目标：同事打开一个**固定链接**（类似韩国版），你电脑关机也能用。

推荐平台：**Railway**（常开容器 + 固定 `*.up.railway.app` 域名）

---

## 一次性部署步骤（约 10–15 分钟）

### 1. 把代码推到 GitHub（若还没有仓库）

在本机项目目录执行（把 `YOUR_GITHUB_USER` 换成你的）：

```bash
cd ~/Projects/meitu-jp-kol-dashboard
git remote add origin https://github.com/YOUR_GITHUB_USER/meitu-jp-kol-dashboard.git
git add -A
git commit -m "Prepare cloud deploy"
git push -u origin HEAD
```

### 2. 注册 Railway 并部署

1. 打开 https://railway.app → 用 GitHub 登录  
2. **New Project** → **Deploy from GitHub repo** → 选这个仓库  
3. 部署完成后点服务 → **Settings** → **Networking** → **Generate Domain**  
   → 得到固定网址，例如：  
   `https://meitu-jp-kol-dashboard-production.up.railway.app`

### 3. 配置环境变量（Variables）

| 变量 | 示例值 |
|------|--------|
| `DATABASE_URL` | `file:/data/prod.db` |
| `AUTH_USERNAME` | `admin` |
| `AUTH_PASSWORD` | 你们约定的密码 |
| `AUTH_SECRET` | 一串随机长字符 |

### 4. 挂载持久磁盘（否则重启丢数据）

服务 → **Settings** → **Volumes** → 添加 Volume：

- Mount Path: `/data`

### 5. 导入数据

打开固定网址 → 登录 → 「数据导入」页上传 Excel/CSV。  
之后同事都用这个固定链接即可，**与你电脑是否开机无关**。

---

## 同事怎么用

1. 浏览器打开：`https://xxxx.up.railway.app`（你生成的那个）  
2. 输入统一用户名 / 密码登录  
3. 正常使用看板  

网址固定，可收藏、可发到飞书群。

---

## 注意

- Cloudflare Tunnel / 本机 IP：**电脑关机网站就没了**，不满足你的前提。  
- Railway 免费额度有限，正式长期用建议升级付费或迁公司服务器。  
- 若公司有美图内网域名，可把 Railway 域名再绑到 `kol-jp.xxx.com`。
