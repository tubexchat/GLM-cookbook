# GLM Cookbook

为智谱大模型API提供的JavaScript客户端。目前支持GLM-4模型。

## 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/GLM-cookbook.git
cd GLM-cookbook

# 安装依赖
npm install
```

## 配置

使用前需要设置智谱AI的API密钥。您可以从[智谱AI开放平台](https://open.bigmodel.cn/)获取API密钥。

有两种方式设置API密钥:

### 方式1: 使用环境变量

```bash
# 设置环境变量
export ZHIPU_API_KEY=your_api_key_here
```

### 方式2: 使用.env文件 (推荐)

创建一个名为`.env`的文件在项目根目录，内容如下:

```
ZHIPU_API_KEY=your_api_key_id.your_api_key_secret
```

注意：`.env`文件不应该提交到版本控制系统中，请确保它已经添加到`.gitignore`文件中。

## 使用方法

```bash
node example.js
```