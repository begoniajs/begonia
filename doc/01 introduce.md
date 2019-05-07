# Begonia 介绍

begonia是一个为微信小程序开发而建立的开源、简单和轻量的开发套件。

包含如下模块:

- 基于简版Redux实现的数据状态管理`bex`
- 提供延迟生效的`ViewModelProxy`
- 帧循环计数器
- 缓存管理
- 实用小工具函数
- 函数队列和管道执行管理

## 快速使用

### 1. 文件拷贝

请将项目目录下的`begonia`拷贝到小程序项目的根目录中即可。

### 2. 导入入口模块，获取代理对象

在小程序的页面或者自定义组件实例中，导入套件的入口文件:

```js
import BE from '../../begonia/begoina';
```

然后，就可以通过变量`BE`来使用套件的具体功能，例如，如果要获取`ViewModelProxy`的实例`vmp`，
可以在页面实例的`onload`方法中:

```js
Page({
  data: {
    groupList:[],
  },
  //1. 声明一个非data的属性
  vmp:null,
  //...
  onLoad: function () {
    //2. 获取一个代理对象，并保存
    this.vmp = BE.getProxy(this);
  },
  //...
});
```

### 3. 使用默认带有的延迟属性变更的功能

小程序开发中，如果想要修改实例的`data`对象中属性，必须使用`setData()`方法。

begonia中的`ViewModelProxy`(`VMP`)提供了延迟属性更改，从而可以收集一段时间内的属性变动，
在规定的更新间隔到来时，一次性的提交属性变动:

#### 形式1：提交一项属性更改:

```js
this.vmp.commit('groupList',[{
    id:'1800',
    name:'一年级B班',
}]);
```
#### 形式2：直接传入一个对象:

```js
this.vmp.commit({
  groupList:[{
    id:'1800',
    name:'一年级B班',
  }],
});
```

#### 更新间隔到期后:

默认设置是100毫秒更新间隔，当间隔到期，VMP内部会使用`setData()`方法，将搜集到的属性改动一次性提交微信小程序框架进行计算生效。

某些情况下，也许你想将提交的属性立即生效，可以使用
```js
this.vmp.validateNow();
```
这样，到当前时间为止，所有提交的属性变更将会立即生效。VMP会清空缓存的对象，等待下一轮时间间隔内提交的属性变动。

延迟更新的时间间隔是可以改变的，首先导入`VMP`模块，然后修改属性`interval`即可，属性接受安全的、非零自然数作为值。

```js
import VMP from './begonia/ViewModelProxy';

//...
VMP.interval = 200; //设置200毫秒间隔
```

### 4. 销毁并回收

当页面发生切换，页面实例和组件实例会被微信小程序框架销毁，此时`onUnload`方法会被触发。
在钩子函数中，可以对begonia提供的对象和功能进行清理，释放不需要的对象。

释放vmp对象实例很简单，只需使用:

```js
this.vmp.destroy();
```

即可。

完整的实例如下：

```js
//...
onUnload(){
  if(this.vmp){
    this.vmp.destroy();
    this.vmp = null;
  }
},
//...
```

## 使用增强模块

begina提供的各项功能，按照相互关系划分为几个独立的模块。
除了几个特殊的模块有依赖关系，其余都为不相互依赖的独立模块,可以单独导入使用。

当然，begoina也提供了装载模块的方法。
经过装载模块，可以在实例上提供快捷入口方法，使用功能。

例如，想要使用内置的简版redux模块，您可以首先在一个独立的`js`文件中，编写`store`相关的代码:

```js
//导入begoina
import BE from '../common/begoina';
//导入bex模块
import bex from '../common/bex';

//导入自定义的状态管理模块
import group from './group';
import subject from './subject';

//装载bex模块
BE.use(bex);

//创建store实例，并配置它
let store = bex.createStore({
    modules:{
        group,
        subject,
    },
    debug:true,
});
```
完成之后，在小程序页面或组件实例中:

```js
Page({
  data: {
    groupList:[],
    subjectList:[],
  },
  vmp:null,
  onLoad: function () {
    this.vmp = BE.getProxy(this);

    //访问store实例
    let store = this.vmp.$store;
    //查看state状态树
    let state = this.vmp.$store.getState();

    //通过getters对象访问具体的state属性
    let list = this.vmp.$getters.groupList;

    //发起一个action，引起状态变更
    this.vmp.$actions.getGroupList('10');

    //监控state树中的属性，在更新时，自动提交vmp延迟更新data
    this.vmp.watch([
      'groupList',
      'subjectList',
    ]);
  },
  //...
});
```

诚如所见，为方便使用，`bex`在API的名称设计上借鉴了很多[vuex框架](https://vuex.vuejs.org/zh-cn/)的API，
但实际使用还是有些许不同。

如果想要具体了解增强模块的使用方法，可以查看如下文档:

- [VMP代理对象](https://github.com/Bravechen/begonia/blob/master/doc/02%20VMP%E4%BB%A3%E7%90%86%E5%AF%B9%E8%B1%A1.md)
- [数据状态管理的关系](https://github.com/Bravechen/begonia/blob/master/doc/03%20%E6%95%B0%E6%8D%AE%E7%8A%B6%E6%80%81%E7%AE%A1%E7%90%86%E7%9A%84%E5%85%B3%E7%B3%BB.md)
- [缓存管理](https://github.com/Bravechen/begonia/blob/master/doc/04%20%E7%BC%93%E5%AD%98%E7%AE%A1%E7%90%86.md)
- [日志管理](https://github.com/Bravechen/begonia/blob/master/doc/05%20%E6%97%A5%E5%BF%97%E7%AE%A1%E7%90%86.md)



如果想要自己编写模块扩展功能，可以查看[开发自定义模块](https://github.com/Bravechen/begonia/blob/master/doc/08%20%E5%BC%80%E5%8F%91%E8%87%AA%E5%AE%9A%E4%B9%89%E5%A2%9E%E5%BC%BA%E6%A8%A1%E5%9D%97.md)文档。


# 开源协议

MIT