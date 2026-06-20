// ==UserScript==
// @name         B站瓦哩师徒杯S3真实票数显示
// @namespace    https://github.com/SlieFamily/bilibili-wali-vote
// @version      1.0.0
// @description  自动获取并覆写B站瓦哩师徒杯S3真实的投票数（消除“万”字模糊显示，精确到个位）
// @author       Slie-wdy
// @match        *://live.bilibili.com/blackboard/era/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// @run-at       document-start
// @license      MIT
// @supportURL   https://github.com/SlieFamily/bilibili-wali-vote/issues
// @homepageURL  https://github.com/SlieFamily/bilibili-wali-vote
// ==/UserScript==

(function() {
    'use strict';

    // 由于部分脚本管理器存在沙箱环境隔离，最稳妥的方法是将拦截逻辑直接注入到原网页的原生上下文中
    const injectScript = document.createElement('script');
    injectScript.textContent = `
    (function() {
        console.log("%c[瓦哩师徒杯] 🚀 核心网络拦截器已就绪，正在监听数据...", "color: #00a1d6; font-weight: bold;");

        // 维护一个全局字典，存储最新拦截到的【选手名字: 真实票数】
        window.__realVoteMap = window.__realVoteMap || {};

        // 核心 DOM 覆写函数
        window.__renderRealVotes = function() {
            for (let [name, realVote] of Object.entries(window.__realVoteMap)) {
                let xpath = \`//*[text()='\${name}']\`;
                let matchingNodes = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

                for (let i = 0; i < matchingNodes.snapshotLength; i++) {
                    let nameNode = matchingNodes.snapshotItem(i);
                    let container = nameNode;
                    let replaced = false;

                    // 冒泡寻找包含票数文本的父容器
                    for (let level = 0; level < 5; level++) {
                        if (!container) break;
                        let walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
                        let textNode;
                        
                        while ((textNode = walker.nextNode())) {
                            let val = textNode.nodeValue.trim();
                            // 精准匹配原有的模糊票数，跳过"投票"按钮本身
                            if (val.endsWith("票") && val !== "投票" && val !== "投票次数" && /\\d/.test(val)) {
                                let newVal = \`\${realVote}票\`;
                                if (textNode.nodeValue !== newVal) {
                                    textNode.nodeValue = newVal;
                                }
                                replaced = true;
                            }
                        }
                        if (replaced) break;
                        container = container.parentElement;
                    }
                }
            }
        };

        // 1. 拦截 Fetch 请求 (现代单页应用常用的请求方式)
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            const url = args[0] instanceof Request ? args[0].url : args[0];
            
            // 如果捕获到投票 API 的请求
            if (url && url.includes('/x/activity_components/vote_new/rank')) {
                response.clone().json().then(data => {
                    if (data.code === 0 && data.data && data.data.items) {
                        data.data.items.forEach(item => {
                            window.__realVoteMap[item.item.title] = item.vote;
                        });
                        // 延迟执行，等待 React 将 DOM 节点渲染完毕后再覆写
                        setTimeout(window.__renderRealVotes, 50);
                        setTimeout(window.__renderRealVotes, 300);
                    }
                }).catch(err => console.error("[瓦哩师徒杯] Fetch解析错误:", err));
            }
            return response;
        };

        // 2. 拦截 XHR 请求 (兼容 Axios 或老式 Ajax 请求)
        const originalXHR = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this.addEventListener('load', function() {
                if (typeof url === 'string' && url.includes('/x/activity_components/vote_new/rank')) {
                    try {
                        const data = JSON.parse(this.responseText);
                        if (data.code === 0 && data.data && data.data.items) {
                            data.data.items.forEach(item => {
                                window.__realVoteMap[item.item.title] = item.vote;
                            });
                            setTimeout(window.__renderRealVotes, 50);
                            setTimeout(window.__renderRealVotes, 300);
                        }
                    } catch(err) {}
                }
            });
            return originalXHR.call(this, method, url, ...rest);
        };

        // 3. 部署 MutationObserver (即使没有网络请求，纯前端切换 Tab 也能触发覆写)
        const observer = new MutationObserver(() => {
            window.__renderRealVotes();
        });
        
        const startObserve = () => {
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                requestAnimationFrame(startObserve); // Body还没挂载就等下一帧
            }
        };
        startObserve();

    })();
    `;
    
    // 注入页面后立即移除该 <script> 节点，深藏功与名
    document.documentElement.appendChild(injectScript);
    injectScript.remove(); 
})();
