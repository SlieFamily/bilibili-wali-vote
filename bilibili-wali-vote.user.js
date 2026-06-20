// ==UserScript==
// @name         B站瓦哩师徒杯S3真实票数显示
// @namespace    https://github.com/SlieFamily/bilibili-wali-vote
// @version      1.0.0
// @description  自动获取并覆写B站瓦哩师徒杯S3真实的投票数（消除“万”字模糊显示，精确到个位）
// @author       Slie-wdy
// @match        *://live.bilibili.com/blackboard/era/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// @license      MIT
// @supportURL   https://github.com/SlieFamily/bilibili-wali-vote/issues
// @homepageURL  https://github.com/SlieFamily/bilibili-wali-vote
// ==/UserScript==

(async function() {
    'use strict';

    console.log("%c[瓦哩师徒杯] 开始获取真实票数...", "color: #00a1d6; font-weight: bold;");

    // 你提供的徒弟组和师父组 API 接口基准链接
    const apiUrls = [
        "https://api.bilibili.com/x/activity_components/vote_new/rank?csrf=149352f0b206ed3cfdf3ee6ee2ab4b76&group_id=24ERA1wloghvtgl00&ps=12&random_version=&type=0&vote_id=23ERA1wloghvxay00&web_location=888.148305",
        "https://api.bilibili.com/x/activity_components/vote_new/rank?csrf=149352f0b206ed3cfdf3ee6ee2ab4b76&group_id=24ERA1wloghvtc600&ps=12&random_version=&type=0&vote_id=23ERA1wloghvxay00&web_location=888.148305"
    ];

    // 用于存储 { "选手名字": 真实票数 } 的字典
    let realVoteData = {};

    // 1. 自动轮询 API 获取全部页面的数据
    for (let baseUrl of apiUrls) {
        let pn = 1;
        let totalPages = 1;
        let urlObj = new URL(baseUrl);

        do {
            urlObj.searchParams.set('pn', pn);
            try {
                let res = await fetch(urlObj.href, { credentials: 'include' });
                let json = await res.json();

                if (json.code === 0 && json.data && json.data.items) {
                    // 记录这一页每个选手的真实票数
                    json.data.items.forEach(item => {
                        realVoteData[item.item.title] = item.vote;
                    });
                    // 计算总页数以决定是否继续请求下一页
                    totalPages = Math.ceil(json.data.page.total / json.data.page.page_size);
                } else {
                    console.error("[瓦哩师徒杯] 获取票数API异常:", json);
                    break;
                }
            } catch (e) {
                console.error("[瓦哩师徒杯] 网络请求失败:", e);
                break;
            }
            pn++;
        } while (pn <= totalPages);
    }

    console.log("%c[瓦哩师徒杯] 已获取全部真实票数，准备覆写页面！", "color: #4caf50; font-weight: bold;", realVoteData);

    // 2. 核心覆写渲染逻辑
    function applyRealVotes() {
        // 遍历拿到的真实数据字典
        for (let [name, realVote] of Object.entries(realVoteData)) {
            // 使用 XPath 寻找页面中包含选手名字的元素节点
            let xpath = `//*[text()='${name}']`;
            let matchingNodes = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

            for (let i = 0; i < matchingNodes.snapshotLength; i++) {
                let nameNode = matchingNodes.snapshotItem(i);
                let container = nameNode;
                let replaced = false;

                // 冒泡式向上寻找包含票数文本的父容器（最多查找 5 层）
                for (let level = 0; level < 5; level++) {
                    if (!container) break;
                    
                    // 遍历当前容器下的所有纯文本节点
                    let walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
                    let textNode;
                    while ((textNode = walker.nextNode())) {
                        let val = textNode.nodeValue.trim();
                        
                        // 精准匹配原有的模糊票数，如 "5.9万票" 或 "5160票"
                        // 过滤掉 "投票" 按钮文字以及 "投票次数" 提示
                        if (val.endsWith("票") && val !== "投票" && val !== "投票次数" && /\d/.test(val)) {
                            let newVal = `${realVote}票`;
                            if (textNode.nodeValue !== newVal) {
                                textNode.nodeValue = newVal;
                            }
                            replaced = true;
                        }
                    }
                    if (replaced) break; // 找到了并完成替换，终止向上冒泡
                    container = container.parentElement;
                }
            }
        }
    }

    // 执行首次页面覆写
    applyRealVotes();

    // 3. 开启 MutationObserver 监听 DOM 变化，以兼容“翻页”或“动态加载”动作
    const observer = new MutationObserver(() => {
        applyRealVotes();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log("%c[瓦哩师徒杯] 监听器部署完毕，翻页时将自动更新票数！", "color: #ff9800; font-weight: bold;");
})();
