# 小程序后端服务

此项目为个人独立开发的社交分享类小程序后端服务。项目使用 Node.js + Express + MySQL + Sequelize ORM 开发，提供用户管理、内容分享、社交互动等完整功能。

小程序端访问地址：[share-life](https://github.com/2918894301/share-life)

## 项目概述

这是一个完整的社交分享平台后端，支持用户注册登录、发布笔记、点赞收藏、评论互动、用户关注、私信交流等功能。专为微信小程序前端提供稳定、高效的 API 服务。

## 技术栈

- 后端框架 ：Node.js + Express
- 数据库 ：MySQL
- ORM 工具 ：Sequelize
- 认证机制 ：JWT (JSON Web Token)
- 云存储 ：阿里云 OSS

## 项目结构

```
├── app.js                # 应用入口文件
├── bin/                  # 启动脚本目录
│   └── www               # 服务器启动文件
├── config/               # 配置文件目录
│   ├── config.json       # 数据库配置
│   └── routes.js         # 路由配置
├── middlewares/          # 中间件目录
│   └── user-auth.js      # 用户认证中间件
├── migrations/           # 数据库迁移文件
├── models/               # 数据模型目录
├── routes/               # API路由目录
├── seeders/              # 数据库种子文件
├── utils/                # 工具函数目录
└── public/               # 静态资源目录
```

### 核心模块说明

- 认证模块 ：提供用户注册、登录、密码找回等功能
- 笔记模块 ：支持笔记的创建、查询、更新、删除等操作
- 用户模块 ：管理用户信息、个人主页、关注关系等
- 互动模块 ：实现点赞、收藏、评论等社交互动功能
- 搜索模块 ：提供内容和用户搜索功能
- 消息模块 ：支持用户间私信交流(待开发)

## 配置环境变量

将 .env.example 文件拷贝为 .env 文件，并修改配置。

```
PORT=3000
SECRET=你的秘钥
NODE_ENV=development

ALIYUN_ACCESS_KEY_ID=阿里云的 AccessKey ID
ALIYUN_ACCESS_KEY_SECRET=阿里云的 AccessKey Secret
ALIYUN_BUCKET=阿里云 OSS 的 Bucket 名称
ALIYUN_REGION=阿里云 OSS Bucket 所在地域名称
```

- `NODE_ENV` 配置为开发环境，如部署在生产环境可改为 `production` 。
- `PORT` 配置为服务端口
- `SECRET` 配置为 JWT 秘钥。
- `ALIYUN` 开头的配置为阿里云 OSS 相关配置，用于文件上传存储

## 生成秘钥

在命令行中运行

```
node
```

进入交互模式后，运行

```
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

复制得到的秘钥，并填写到 .env 文件中的 SECRET 配置。

PS：可以使用 ctrl + c 退出交互模式。

## 配置数据库

使用自行安装的 MySQL，需要修改 config/config.json 文件中的数据库用户名与密码。

```
{
  "development": {
    "username": "您的数据库用户名",
    "password": "您的数据库密码"
  }
}
```

## 安装与运行

```

# 安装项目依赖包

npm i

# 创建数据库。如创建失败，可以手动建库。

npx sequelize-cli db:create --charset utf8mb4 
--collate utf8mb4_general_ci

# 运行迁移，自动建表。

npx sequelize-cli db:migrate

# 运行种子，填充初始数据。
# 注意：初始数据包含的图片未上传，请自行初始化初始数据。
npx sequelize-cli db:seed:all

# 启动服务

npm start
```

访问首页地址： http://localhost:3000/latest

## 数据模型

系统包含以下主要数据模型：

- User ：用户信息，包含用户名、密码、昵称、头像等
- Note ：笔记内容，支持文本、图片等多媒体内容
- Category ：笔记分类
- Comment ：评论信息
- Like ：点赞记录
- Collection ：收藏记录
- Follow ：关注关系
- Message ：私信消息

## 开发说明

### 开发环境

- Node.js 14.x 或更高版本
- MySQL 5.7 或更高版本
- 推荐使用 VSCode 进行开发

### 数据库管理

```
# 创建迁移文件
npx sequelize-cli migration:generate --name 
create-table-name

# 运行迁移
npx sequelize-cli db:migrate

# 撤销最近一次迁移
npx sequelize-cli db:migrate:undo

# 生成种子文件
npx sequelize-cli seed:generate --name demo-data

# 运行种子
npx sequelize-cli db:seed --seed seed-filename.js
```
