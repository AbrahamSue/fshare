// ==UserScript==
// @name          Auto-behavior (newsmth)
// @name:zh-CN   自动行为 (水木 Footprints)
// @namespace    http://m.newsmth.net/
// @version      0.1
// @description  Newsmth will kick idle users, and this will log in when needed.
// @author       Cyan Kindle  <cyankindle66@gmail.com>
// @match        http://m.newsmth.net/*
// @grant        none
// @license      MIT
// ==/UserScript==

/* global IFrame_MyReports, Logger, MailApp, CacheService, ContentService */
/* global HtmlService, ui, Browser, GmailApp, SpreadsheetApp */
/* eslint no-prototype-builtins: "off" */
/* eslint no-constant-condition: "off" */
/* eslint no-extra-semi: "warn" */

;               // eslint-disable-line
function __start__(input_username, input_password) {
    "use strict";

    // Your code here...
    const $ = (s, x = document) => x.querySelector(s);
    const $$ = (s, x = document) => Array.from(x.querySelectorAll(s));
    const $x = (xpath, startNode = document) => document.evaluate(xpath, startNode);
    const $el = (tag, opts) => {
        const el = document.createElement(tag)
        Object.assign(el, opts)
        return el
    };
    const $http = obj => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open(obj.method || "GET", obj.url);
            if (obj.headers) {
                Object.keys(obj.headers).forEach(key => {
                    xhr.setRequestHeader(key, obj.headers[key]);
                });
            }
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    resolve(xhr.response);
                } else  {
                    reject({status: xhr.status, statusText: xhr.statusText});
                }
            };
            // xhr.onreadystatechange = () => {
            //    console.log( xhr );
            //    if (xhr.readyState === xhr.DONE) { console.log(xhr.responseURL); }
            // };
            xhr.onerror = () => reject({status: xhr.status, statusText: xhr.statusText});
            xhr.send(obj.body);
        });
    };

    //newsmth.net
    const newsmth_login_via_xhr = (user, pw) => {
        //let bu = 'http://m.newsmth.net';
        let bu = document.location.protocol + '//' + document.location.host;
        console.log('bu = ' + bu);
        $http({
            url: `${bu}/user/login`,
            method: 'POST',
            body: `id=${user}&passwd=${pw}&save=on`,
            headers: {
//                'Origin': bu,
//                'Referer': document.location.href,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(r=>{
            console.log( r );
            console.log( document.location );
            document.location.reload()
        }).catch(r=>{
            if ( r.status === 0 ) { 
                // WR: newsmth site bug
                //after newsmth upgraded to https:// schema, the login response still redirect to http:// schema
                //XMLHttpRequest has no control of follow-redirects, so $http will be rejected after login
                //I use this workaround to let script will still redirect to original page even being rejected.
                document.location.reload();
            }
        });
    };
    const newsmth_login_via_form = (user, pw) => {
        $("div#m_main").innerHTML = `
            <form action="/user/login" method="post" style="display:none">
            <input type="text" name="id" />
            <input type="password" name="passwd" />
            <input type="checkbox" name="save" />
            <input type="submit" class="btn" value="登录" />
            </form>
        `;
        $("input[name='id']").value = user;
        $("input[name='passwd']").value = pw;
        $("input[name='save']").checked = true;
        $("input.btn").click();
    };
    const newsmth_board_hide_system_post = () => {
        [...$$('li>div:nth-child(2)>a:nth-child(1)')].filter( i => i.innerText == 'deliver'
            && i.parentElement.previousElementSibling.firstElementChild.innerText.search('发文权限') > 0
        ).forEach(
            i => [...i.parentElement.parentElement.getElementsByTagName('*')]
                    .forEach( j => j.style.color = '#cccccc' )
        );
    };
    const newsmth_board_add_last_page_link = () => {
        $$('li>div:nth-child(1)').forEach( i => {
            let m =  i.innerText.match(/\(([0-9]+)\)$/);
            if (!m) return;
            let an = parseInt( m[1] );
            let pn = Math.floor( (an + 10) / 10 ); // the number is reply number, No. 10 reply will be placed in page 2.
            if (an == 0) { //expand this link

            } else if (pn > 1) { // add a click to the last page
                i.innerHTML = i.innerHTML.replace( /\(([0-9]+)\)$/,
                    i.firstElementChild.outerHTML.replace( /(<a .*href=['"][^'"]+)(['"][^>]*>)([^<]+)<\/a>/,
                        (m, p1, p2, p3, o, s) => `&nbsp;(&nbsp;${p1}?p=${pn}${p2}${an}</a>&nbsp;)` ));
            }
//                            .replace( />[^<]*</, `>&nbsp;${an}&nbsp;<` )
//            $$('li>div>a[href^="/article"]').forEach(
//                i=>{ i.outerHTML += '&nbsp;' + i.outerHTML.replace(/">.*</i,'?p=999">&gt;&gt;<') + '&nbsp;'; }
//            );
        });
    };
    const newsmth_article_query_author = () => {
        [...new Set($$('a[href^="/user/query"]').map(a=>a.innerText))].forEach ( v => {
            var u = document.location.origin + '/user/query/' + v;
            $http({url: u}).then( r=> {
                // console.log(u + '\n' + r);
                var ol = Object.fromEntries([...r.matchAll(/<li[^>]*>(.*?)<\/li>/gi)].map(i=>i[1].split(':&nbsp;')));
                // v.innerHTML += [...r.matchAll(/<li[^>]*>(.*?)<\/li>/gi)].map(i=>i[1].split(':&nbsp;')[1]).join('&nbsp');
                var color_code = ol['当前状态']=='目前不在站上'?'ababab':'ff0000'
                var level_map = { '用户': ' ', '核心驻版': 'Ꙭ'};
                var level = level_map[ol['等级']];
                if (!level) level = ol['等级'];
                var html = `(<span style='color: #${color_code}'>${ol['昵称']}: ${level} ${ol['生命力']}/${ol['贴数']}</span>)
                            |&nbsp;${ol['最后访问IP']}&nbsp;`;
                $$(`a[href="/user/query/${v}"]`).forEach( i => {
                    i.href = `https://jinghuasoft.com/smth.jsp?board=&orderBy=&asc=&d=&dm=&dc=&p=&pp=true&view=0&author=${i.innerText}&page=1`;
                    i.outerHTML += html;
                });
            });
        });
    };
    const newsmth_article_query_author_queryall = () => {
        // article pages looks like http://m.newsmth.net/article/MilitaryView/2145545?p=2
        //[...new Set($$('a[href^="/user/query"]').map(a=>`${document.location.origin}/user/query/${a.innerText}`))]
        // $$('a[href^="/user/query"]').forEach( (v,i)=>v.title=`[${i}] ` + v.innerText );

        $$('a[href^="/user/query"]').forEach( (v,i)=>{
            var au = v.innerText;
            // check if there is any existing author fetched, use it instead of fetch again
    //                v.title = `[${i}]: (${au})`;
            v.title = au;
            v.href = `https://jinghuasoft.com/smth.jsp?board=&orderBy=&asc=&d=&dm=&dc=&p=&pp=true&view=0&author=${au}&page=1`;
            v.target = '_blank';

            var u = document.location.origin + '/user/query/' + v.innerText;
            $http({url: u}).then( r=> {
                // console.log(u + '\n' + r);
                var ol = Object.fromEntries([...r.matchAll(/<li[^>]*>(.*?)<\/li>/gi)].map(i=>i[1].split(':&nbsp;')));
                // v.innerHTML += [...r.matchAll(/<li[^>]*>(.*?)<\/li>/gi)].map(i=>i[1].split(':&nbsp;')[1]).join('&nbsp');
                var color_code = ol['当前状态']=='目前不在站上'?'ababab':'ff0000'
                var level;
                if ("用户" == ol['等级']) {
                    level = "";
                } else if ("核心驻版" == ol['等级']) {
                    level = "Ꙭ"
                } else {
                    level = ol['等级'];
                }
                v.outerHTML += `
                    (<span style='color: #${color_code}'>${ol['昵称']}: ${level} ${ol['生命力']}/${ol['贴数']}</span>)
                    |&nbsp;${ol['最后访问IP']}&nbsp;
                `
            });
        });
    };
    const on_element_in_view = (elem, cb)=>{
        var handlerFired = false, inRangePrev = null;
        var o = typeof elem === 'string'? document.querySelector(elem):elem;
        const onscroll = (e) => {
            var oy = o.getBoundingClientRect().y;
            var inRange = oy > 0 && window.innerHeight > oy;
//            console.log('inRangePrev=', inRangePrev, 'inRange=', inRange);
            if (inRangePrev !== null && inRangePrev != inRange) {
                var cont = cb(inRange);
                if (!cont) {
                    window.removeEventListener('scroll', onscroll);
                }
            }
            inRangePrev = inRange;
        }
        onscroll();
        window.addEventListener('scroll', onscroll);
    }
    const newsmth_article_expand_next_page = () => {
        var elems = document.querySelectorAll('.sec.nav');
        var elem = elems ? elems.length > 2 ? elems[2] : null : null
        // $$('.sec.nav')[2].getBoundingClientRect().y]
        // on_element_in_view(elem, (f)=>(console.log(`now ${f?'in':'out'} view`), true));
        on_element_in_view(elem, f=>{
            console.log(`now ${f?'in':'out'} view`);
            if (!f) return true;
            const ml = [ '下页', '尾页' ].map(v=>( $$('form>a').filter(v1=>(v1.text||'')===v) || [''] )[0].href.match(/[0-9]+$/i));
            const [pagecur, pagemax] = ml.map(v=>parseInt(v||'0'));

            // if (!ml[0] || !ml[1]) return false;
            // var pagemax = parseInt(ml[1]);
            // if (parseInt(ml[0]) > pagemax) return false;
            const u = ml[0].input;
            console.log('max=', pagemax, 'cur=', pagecur, 'url=', u);
            if (pagecur > pagemax) return false;
            $('.list.sec').outerHTML += '<div class="sec hla"><p align=center>Loading more</p></div>'
            $http({url: u}).then(r=>{
                // var ms = r.match(/<li( class="hla">)>.*<\/li>/gi);
                var ms = r.match(/<li( class="hla")?>.*<\/li>/gi);
                $('div.sec.hla').outerHTML = '';
                $$('form>a').forEach( (v,i,arr)=>{
                    if (v.text!=='下页') return;
                    var m = v.href.match(/=([0-9]+)$/);
                    if (!m) return;
                    var p = parseInt(m[1]) + 1;
                    if (p > pagemax) return;
                    var ap = arr[i].parentNode.querySelector('a.plant');
                    ap.innerHTML = ap.innerHTML.replace(/^[ 0-9]+\//, `${p}/`);
                    arr[i].href = arr[i].href.replace(/=([0-9]+)$/i, `=${p}`);
                    // console.log(`arr[${i}]=${arr[i].href}`);
                    // console.log('i=', i, 'm=', m, 'p1=', p1, ' => ', '='+(parseInt(p1)+1));
                });
                var wt = window.scrollY;
                $('.list.sec').innerHTML += ms.join('');
                window.scrollTo(window.scrollX, wt);
            });
            return (pagecur < pagemax);
        });
    }

    var o = null;

    if (window.top === window.self) {         //--- Script is on domain_B.com when/if it is the MAIN PAGE.
    } else {         //--- Script is on domain_B.com when/if it is IN AN IFRAME.
        // DO YOUR STUFF HERE.
    }

    if (document.location.host == 'github.com') {
        o = $('div.container-lg').style ('max-width: 100%');
    } else if (/mitbbs\.com$/.test(document.location.host)){
        o = undefined;
    } else if (document.location.host == 'm.newsmth.net' || document.location.host == 'm.mysmth.net'){
        o = $('div#ad_container')
        if (o) {
            o.innerHTML = ''
        }

        o = $('div.menu.nav')
        if( o && o.innerText.search('收藏') < 0 ) {
            // $('div.menu.nav>a[href="/section"]').outerHTML += '| <a href="/favor">收藏</a>'
            o.firstChild.outerHTML += '|<a href="/favor">收藏</a>'
        }

        o = $("div#m_main>div");
        if (!o){ // not likely happen
        } else if (o.innerText == "登陆成功" && document.location.search == "?m=0108") { //check cookie redirection
            var rl = document.cookie.split('; ').filter(v=>v.startsWith("LastURL="))[0]
            if (rl){
                ;           // eslint-disable-line
            }
        } else if ( o.innerText == "您无权阅读此版面" || o.innerText == "您未登录,请登录后继续操作" ) {
            o.innerText += "。     【自动脚本】 登录中";
            // newsmth_login_via_form(input_username, input_password);
            newsmth_login_via_xhr(input_username, input_password);
        } else if (document.location.pathname.match(/^\/board\//i)) {
            newsmth_board_hide_system_post();
            newsmth_board_add_last_page_link();
        } else if (document.location.pathname.match(/^\/article\/[^/]+\/[0-9]+/i)) {
            newsmth_article_expand_next_page();
            newsmth_article_query_author();
        } else { //other pages

        }
        //end of code for m.newsmth.net
    }
}


//  Cookie sample
//            document.cookie = "LastURL="
//                  + document.location.href
//                  + "; expires=" + (d = new Date(), d.setTime(d.getTime()+5), d.toUTCString())
//                  + "; path=/";
//            document.cookie.split('; ').filter(v=>!v.startsWith("LastURL=")).join('; ')
//                  + " LastURL=" + document.location.href
//                document.cookie = "LastURL=; expires=" + (d = new Date(), d.setTime(d.getTime()+5), d.toUTCString()) + "; path=/";
//                window.location = rl.slice(8)
