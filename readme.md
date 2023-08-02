## open-browser

优化 webpack-dev-server 每次编译后都新开浏览器 tab

## 安装

```js
yarn add open-browser-for-webpack-mac -D
```

## 使用

```js
const OpenBrowser = require('open-browser-for-webpack-mac');
module.exports = {
    ...,
    plugins:[
        new OpenBrowser(function(host, port) {
            return `http://${host}:${port}/#/home`;
        }, 9090),
    ]
}
```

## 提醒

- 仅支持 chromium 内核的浏览器

- 仅在 Mac 中使用

- 提前设置正确的port
