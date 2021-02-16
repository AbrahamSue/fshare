function __start__(...args) {
//    'use strict';

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
    // Your code here...

    //__start__(['site_c18', 'pre']);
    const site_c18 = (tag) => {
        tag = tag || 'body';
        $(tag).innerHTML = $(tag).innerHTML.replace(/>[^<>]*</gi, m=>m.replace(/https?:\/\/[^\s]+/gi, m=>`<a href="${m}" target="_blank">${m}</a>`));
    }

    args.forEach( va=>eval(va.shift()).apply(null, va) );
}

//test
// __start__(['site_c18', 'pre']);
//
