# B站瓦哩师徒杯S3真实票数显示 🏆

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GreasyFork](https://img.shields.io/badge/GreasyFork-v1.0.0-green.svg)](你的GreasyFork脚本链接)

一款用于浏览器（Tampermonkey / Violentmonkey）的用户脚本，可自动抓取并覆写 Bilibili 瓦哩师徒杯 S3 投票页面的真实选票数据，消除“X万”的模糊显示，精确到个位数。

## ✨ 核心功能

* **精确显示：** 突破前端“万票”显示限制，直接调用 B 站后台 API 获取精确到个位的真实票数。
* **双组支持：** 自动拉取并解析“师父组”与“徒弟组”的所有选手数据。
* **动态监听：** 完美兼容原页面的翻页功能，点击“上一页/下一页”后，脚本会自动识别新加载的卡片并实时覆写。
* **安全无感：** 纯前端 DOM 替换，仅读取公开 API，不涉及任何账号敏感操作。

## 📦 安装指南

1. **安装脚本管理器：**
   推荐在浏览器中安装 [Tampermonkey (油猴)](https://www.tampermonkey.net/) 或 [Violentmonkey (暴力猴)](https://violentmonkey.github.io/) 扩展。
2. **安装本脚本：**
   * **方式一 (推荐)：** 访问 [GreasyFork 页面](你的GreasyFork脚本链接) 并点击“安装此脚本”。
   * **方式二：** 点击 [这里](https://raw.githubusercontent.com/SlieFamily/bilibili-wali-vote/main/bilibili-wali-vote.user.js) 安装 Github 最新 Raw 版本。

## 🚀 使用方法

脚本安装启用后，正常访问 [瓦哩师徒杯S3页面](https://live.bilibili.com/blackboard/era/eXYVPfN7lWHVt7vY.html)，页面加载完成后即可看到各个选手的精确票数。

## 🛠️ 技术说明

* 拦截点：利用 `MutationObserver` 监听 DOM 树变化。
* 数据源：`api.bilibili.com/x/activity_components/vote_new/rank`
* 采用冒泡机制精准替换对应 DOM 节点的文本，防止误伤原有的“投票”按钮。

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。请勿用于商业用途或恶意刷票。
