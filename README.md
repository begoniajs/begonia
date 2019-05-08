# Begonia 介绍

[begonia](https://github.com/begoniajs/begonia)是一个为微信小程序开发而建立的开源、简单和轻量的开发框架。

具有如下特性:

- 基于代理模式构建小程序App实例、Page实例和Component实例
- 提供属性延迟生效的功能，减少多次调用setData；通过延迟时间在宏观上控制setData提交的频次和数量。
- 自动将Page实例的`data`和Component实例的`data`中的属性转换为同名的`getter`和`setter`（自动提交属性变动），简化使用方式。
- 提供增强模块管理，可以基于begonia扩展功能。并借由模块生命周期细粒度的控制创建小程序Page实例和Component实例的过程。
- 支持npm安装，并符合小程序npm开发部署要求。

## 快速使用

### 1. 安装

请在小程序项目的根目录下(即 `project.config.js` 中的 `miniprogramRoot` 字段)执行`npm`安装:

```
$ npm install begonia
```

### 2. 导入模块

在小程序的`app.js`、页面或者自定义组件实例中，导入入口文件:

```js
import BE from 'begonia';
```

### 3. 创建实例

然后，就可以通过变量`BE`来使用套件的具体功能:

#### 创建根级`App`实例

```js
import BE from 'begonia';

// 打开debug模式，可以在console面板查看运行时的日志输出
BE.debug = true;

// app.js
App(
  BE({
    // 将转化为globalData
    data() {
      return {};
    },
    onLaunch(options) {

    },
    onShow(options) {
    
    },
    onHide() {

    },
    onError(msg) {
      console.error(msg);
    },
    onPageNotFound() {
      console.error(msg);
    },
  })
);
```

#### 创建页面对象

```js
// /pages/example/example.js
import BE from 'begonia';

Page(
  BE.page({
    /**
     * 页面的初始数据
     */
    data(){
      return {
        userId: 0
      };
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      // 使用begonia为实例提供的commit()方法提交属性变动
      this.commit('userId', 10);
      // 另外一种提交形式
      this.commit({
        userId: 12
      });
      // 甚至，还可以这样
      this.userId = 14;
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    }
  })
);
```

在`onLoad`方法中，有3次属性的提交，但是最终会真正采用`setData()`改变的只有第三次的提交，框架在内部会舍去前两次的重复提交。

如果您想在提交一次属性变动之后，立即使其生效。可以使用如下形式：

```js
//...

this.commit('userId', 10);
this.validateNow();

//...
```
通过调用框架赋予实例的`validateNow()`方法，会使属性变动立即生效，其本质和直接使用`setData`没有区别。当然，为了避免频繁使用`setData`提交变动，请谨慎使用`validateNow`。确保只在必要时使用它。

#### 创建组件实例

```js
import BE from 'begonia';

Component(
  BE.component({
    /**
     * 组件的属性列表
     */
    properties: {
      sysId: {
        type: Number,
        value: 0
      }
    },
    /**
     * 组件的初始数据
     */
    data(){
      return {
        userId: 0
      };
    },
    created() {
      // 根据小程序组件的内部机制，不可以在此提交属性变动
    },
    attached() {
      // 使用begonia为实例提供的commit()方法提交属性变动
      this.commit('userId', 10);
      // 另外一种提交形式
      this.commit({
        userId: 12
      });
      // 甚至，还可以这样
      this.userId = 14;
    },
    /**
     * 组件的方法列表
     */
    methods: {
    }
  })
);

```
## 其他功能

### 使用默认带有的延迟属性变更的功能

小程序开发中，如果想要修改实例的`data`对象中属性，必须使用`setData()`方法。

begonia框架内部使用`ViewModelProxy`(`VMP`)提供了延迟属性更改，从而可以收集一段时间内的属性变动，
在规定的更新间隔到来时，一次性的提交属性变动。

在实例创建的过程中，框架会为每个实例附加2个方法`commit()`和`validateNow()`，用来提交属性变动。
此外，对于页面实例和组件实例的`data`，框架也为实例创建了同名属性的`getter`和`setter`方法，用于获取属性值和提交属性值。
其中`setter`方法的内部，也采用了延迟生效的机制(即与使用`commit()`情况类似)。

##### 形式1：提交一项属性更改:

```js
this.commit('groupList',[{
    id:'1800',
    name:'一年级B班',
}]);
```
##### 形式2：直接传入一个对象:

```js
this.commit({
  groupList:[{
    id:'1800',
    name:'一年级B班',
  }],
});
```

##### 形式3：直接为属性赋值(本质是利用setter间接提交):

```js
this.groupList = [{
    id:'1800',
    name:'一年级B班',
}];
```

#### 更新间隔到期，属性变动生效

默认设置是100毫秒更新间隔，当间隔到期，VMP内部会使用`setData()`方法，将搜集到的属性改动一次性提交微信小程序框架进行计算生效。

某些情况下，也许你想将提交的属性立即生效，可以使用
```js
this.validateNow();
```
这样，到当前时间为止，所有提交的属性变更将会立即生效。VMP会清空缓存的对象，等待下一轮时间间隔内提交的属性变动。

延迟更新的时间间隔是可以改变的，使用`BE`的方法`setInterval`即可，方法接受安全的、非零自然数作为值。

```js
import BE from 'begonia';

//...
BE.setInterval(200); //设置200毫秒间隔
```

### 销毁并回收

当页面发生切换，页面实例和组件实例会被微信小程序框架销毁，此时`onUnload`方法会被触发。
在钩子函数中，begonia会**自动清理**附加在实例对象上的内部属性和方法，释放内部的代理对象。


## 使用增强模块

begonia遵循模块化原则，提供的各项功能均保持相对独立的状态。包括内部的使用的代理对象和延迟提交模块`VMP`也是独立的。
只不过，框架在建立之初就进行了自动装载。

begonia提供的装载模块的方法非常简单：

```js
BE.use(MyModule);
```

例如，我们也提供了一个简版的`redux`模块，您可以首先在一个独立的名为`store.js`的文件中，编写`store`相关的代码:

```js
// store.js

//导入begonia
import BE from 'begonia';
//导入beleaf模块
import Bex from 'beleaf';

//=====>>>装载bex模块<<<=========
BE.use(Bex);

```
完成之后，在小程序页面或组件实例中:

```js
Page(BE.page({
  //...
  vmp:null,
  onLoad: function () {
    //访问store实例
    let store = this.$store;
    //查看state状态树
    let state = this.$store.state;

    //通过getters对象访问具体的state属性
    let list = this.$getters.groupList;

    //发起一个action，引起状态变更
    this.$actions.getGroupList('10');
  },
  //...
}));
```

更多关于`beleaf`的使用细节，您可以访问模块的[GitHub项目仓库](https://github.com/begoniajs/begonia-leaf)，详细了解。

## 说明文档和开发文档

诚如所见，为方便使用，`begonia`和`beleaf`在API的名称设计上借鉴了很多[vue框架](https://cn.vuejs.org/)的API名称，
不过内部实现和实际使用还是不同的。并且从整体上来说，begonia也远不如vue框架及其衍生的众多代码库的功能强大，限于其使用的场景，够用即好。

如果想要具体了解各种使用方法，可以查看如下文档:
- [创建小程序页面和组件对象](https://github.com/begoniajs/begonia/tree/master/doc)
- [VMP代理对象](https://github.com/begoniajs/begonia/tree/master/doc)
- [模块的生命周期](https://github.com/begoniajs/begonia/tree/master/doc)
- [开发自定义模块](https://github.com/begoniajs/begonia/tree/master/doc)
- [API](https://github.com/begoniajs/begonia/tree/master/doc/api)

## 初衷

begonia框架是适用于小程序开发的框架，其所追求的也仅仅是提高小程序开发的效率和改善。更多的意义在于借由对其他框架优点的认识，自行实现，进而达到研究原理的目的。也许以后的发展中会追求多种小程序平台开发的统一，但绝不会努力实现在多种设备终端开发中的统一。

# 开源协议

MIT
