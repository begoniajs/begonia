## 概述

http目录主要提供了常用的http请求方法。

## 依赖

`Request`模块依赖`service/LogManager.js`。用来记录产生错误的日志。

## 错误处理

由于每个方法都返回Promise实例，因此可以使用`.catch()`捕获到。

错误对象的形式如下:

```js
interface Error{
    message:string, //概括描述或者标题
    detail:string,  //详细描述
}
```

## POST

方法签名:

```js
function post(url:string,data:any):Promise

```

使用:

```js
Request.post(url,data)
    .then(function(res){
        //do something for res
    })
        .catch(function(error){
            //handle the error
        });

```

参数:

- url 远程服务地址
- data 参数集合对象

## GET

方法签名:

```js
function get(url:string,data:any):Promise

```

使用:

```js
Request.get(url,data)
    .then(function(res){
        //do something for res
    })
        .catch(function(error){
            //handle the error
        });

```

参数:

- url 远程服务地址
- data 参数集合对象

