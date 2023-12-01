// ==UserScript==
// @name         屏蔽搜索部分结果
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  用于屏蔽某站搜索的部分结果，直接进行移除
// @author       海石花
// @match        https://www.baidu.com/*
// @grant        none
// ==/UserScript==


//arr中填入你要屏蔽的搜索结果,如

//const arr = ['https://example.com', 'https://anotherexample.com'];

const arr = ['https://blog.csdn.net/']

function removeDiv() {

    var contentLeftDiv = document.getElementById('content_left')

    if (contentLeftDiv) {

        // 获取 content-left 下的所有 div 元素

        var divs = contentLeftDiv.querySelectorAll('div')

        divs.forEach(function (div) {

            var muAttributeValue = div.getAttribute('mu')

            if (muAttributeValue && arr.some(site => muAttributeValue.includes(site))) {

                div.remove()

            }

        })

    }

}

//为什么这么多监听器我也不知道，有的不会起效

var targetNode = document

var config = {attributes: true, childList: true, subtree: true}

var observer = new MutationObserver(removeDiv)

observer.observe(targetNode, config)

addEventListener('DOMContentLoaded', removeCsdn)

addEventListener('load', removeCsdn)
