# B站瓦哩师徒杯S3 真实票数助手 🏆

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GreasyFork](https://img.shields.io/badge/GreasyFork-v2.1.0-green.svg)](https://greasyfork.org/zh-CN/scripts/583568-b%E7%AB%99%E7%93%A6%E5%93%A9%E5%B8%88%E5%BE%92%E6%9D%AFs3%E7%9C%9F%E5%AE%9E%E7%A5%A8%E6%95%B0%E6%98%BE%E7%A4%BA)

本项目旨在为 **Bilibili 瓦哩师徒杯 S3** 提供更透明、精确的赛事数据服务。包含两套解决方案：直接修改原网页的**油猴脚本**，以及独立部署的**实时排行榜数据看板**。

---

## 🌟 独立数据看板 (Web端)

基于 Next.js 搭建了一个独立的数据看板网站，方便水友们在不安装任何插件的情况下，直接通过手机或电脑查看实时赛况。

![截图展示](https://gcore.jsdelivr.net/gh/SlieFamily/TempImages@main//Auto/202606231416628.png)

* **Demo访问：** https://vote.qslie.top

* **功能特色：**
  * 📊 实时拉取 B 站后台 API，数据精确到个位。
  * 📈 内置晋级线计算，直观显示选手距离安全区/淘汰区的**差分票数**。

* **本地安装：**
  * 在项目根目录下，运行：`npm install`
  * 启动项目：`npm run dev`

---

## 🛠️ 浏览器增强插件 (油猴脚本)

一款用于浏览器（Tampermonkey / Violentmonkey）的用户脚本，可自动抓取并覆写原网页的选票数据，消除“X万”的模糊显示。

### ✨ 功能展示

| 使用前 (模糊显示) | 使用后 (精准显示) |
| :---: | :---: |
| <img src="https://gcore.jsdelivr.net/gh/SlieFamily/TempImages@main//Auto/202606201849331.png" alt="模糊票数" width="400" /> | <img src="https://gcore.jsdelivr.net/gh/SlieFamily/TempImages@main//Auto/202606201850013.png" alt="真实票数" width="400" /> |

### 📦 安装指南

1. **安装脚本管理器：**
   推荐在浏览器中安装 [Tampermonkey (油猴)](https://www.tampermonkey.net/) 或 [Violentmonkey (暴力猴)](https://violentmonkey.github.io/) 扩展。
2. **安装本脚本：**
   * **方式一 (推荐)：** 访问 [GreasyFork 页面](https://greasyfork.org/zh-CN/scripts/583568-b%E7%AB%99%E7%93%A6%E5%93%A9%E5%B8%88%E5%BE%92%E6%9D%AFs3%E7%9C%9F%E5%AE%9E%E7%A5%A8%E6%95%B0%E6%98%BE%E7%A4%BA) 并点击“安装此脚本”。
   * **方式二：** 点击 [此Raw链接](https://raw.githubusercontent.com/SlieFamily/bilibili-wali-vote/main/bilibili-wali-vote.user.js) 直接通过 Github 安装。

### 🚀 核心优势
* **双组支持：** 自动拉取并解析“师父组”与“徒弟组”的所有选手数据。
* **网络层拦截：** 完美兼容原网页翻页与排序功能。底层劫持 Fetch/XHR 请求，数据实时无缝刷新。
* **安全无感：** 纯前端 DOM 替换，仅读取公开 API，零越权、防封号。

---

## 📄 开源协议 & 声明

* 本项目基于 [MIT License](LICENSE) 开源。
* 本工具仅作为前端学习交流与数据可视化展示使用，不提供任何自动投票或刷票功能。
