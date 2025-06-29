# 🚀 代理分享 ProxyShare

不会 PHP，所以我重写了这个项目。支持多来源订阅整合与解密，支持运行方式：

- ✅ Go 本地运行（`main.go`）
- ✅ Cloudflare Worker 部署（`proxy_protect_ultimate_worker.js`）

你可以用我的公开接口，也可以自己部署使用。

## 🌐 在线地址（Worker）

> 懒人直通车：

```
https://proxyshare.liaoyuan6666.workers.dev/
```

## 📁 仓库结构说明

| 文件名                          | 说明                                               |
|----------------------------------|----------------------------------------------------|
| `main.go`                        | Go 语言版本，支持并发解密、多源合并、本地运行。     |
| `proxy_protect_ultimate_worker.js` | Cloudflare Worker 脚本，支持密码验证、黑名单、日志记录等高级功能。 |

## ☁️ JavaScript 版本（Cloudflare Worker）

### ✅ 前置条件

- 一个启用了 Workers 的 Cloudflare 账户

### 🚀 部署方式

1. 登录 Cloudflare → 创建新 Worker
2. 粘贴 `proxy_protect_ultimate_worker.js` 代码
3. 设置密码、黑名单、Webhook 地址等配置（按源码注释说明）

### 📎 示例请求方式

```
https://your-worker.workers.dev/?file=vmess.txt&key=你的密码
```

## 🖥️ Go 版本（main.go）

### ✅ 环境要求

- 安装 Go 1.16 或更高版本

### 📦 安装与运行

```bash
git clone https://github.com/你的仓库/proxy_share.git
cd proxy_share
go run main.go vmess.txt
```

## ✅ 解密 & 输出类型支持（main.go）

- `merge_base64`：合并并 base64 编码所有来源数据（默认）
- 更多类型支持可自定义添加

## 🔐 Worker 高级功能

- ✅ 密码验证
- ✅ 多源重试
- ✅ 自定义响应格式
- ✅ 黑名单
- ✅ 日志记录与访问统计

## 🧪 辅助管理面板

仓库内附带：

```
dashboard/
├── index.html
├── app.js
├── style.css
```

打开本地网页即可使用，无需后端服务。
