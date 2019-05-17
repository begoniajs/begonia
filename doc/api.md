
### `BE()`

```js

function BE(obj: object): object

```

创建小程序根级对象代理。

```js
App(
  BE({
    data() {
      return {};
    },
    onLaunch() {

    }
    // ...
  })
);
```

### `BE.page()`

```js
function page(obj: object): object
```

创建小程序Page实例代理

```js
Page(
  BE.page({
    data() {
      return {};
    },
    onLoad(options) {

    },
    onUnload() {

    },
    // ...
  })
)
```

### `BE.component()`

```js
function component(obj: object): object
```

创建小程序Component实例代理

```js
Component(
  BE.component({
    data() {
      return {};
    },
    created() {

    },
    attached() {

    },
    // ...
  })
)
```
