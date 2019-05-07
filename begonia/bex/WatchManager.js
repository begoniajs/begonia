/**
 * 观察者管理
 * @version 0.2.0
 * @author Brave Chan on 2017.12
 */
//===========================================================
import { isNothing } from './util';
//============================================================
//不绑定标识，用于表明不将某个属性使用setData()绑定到小程序实例的data上
const NO_BIND = `|@^o^noBind${new Date().getTime()}@|`;

//调试模式开关
let _debug = false;

//代理集合
/*
  {
    vm_id:vmp
  }
*/
let vmpList = {};

//属性观察者集合
/*
  {
    propName:[watcher1,watcher2,...],
  }
 */
let watcherList = {};

//当前需要进行更新的属性列表
let updateList = [];

let _store;     //redux store

//解除订阅state变化的函数
let unsubscribeStateUpadte;
//===========================================
/**
 * @private
 * 订阅state树变动
 */
function subscribeState() {
  unsubscribeStateUpadte = _store.subscribe(stateUpdateHandler);
}

/**
 * @private
 * state更新处理器
 */
function stateUpdateHandler() {

  if (_debug) {
    _outputStateRefresh();
  }

  updateWatcher();
}

/**
 * @private
 * 更新监控属性变化的观察者们
 */
function updateWatcher() {
  if (updateList.length <= 0) {
    return;
  }
  for (let item of updateList) {
    let newValue = _store.getters[item];
    if (_debug) {
      console.info(`Now,the ${item} will updata in WatchManager=======>`, newValue);
    }

    //开始提交vmp属性变动
    let list = watcherList[item];
    if (!list || list.length === 0) {
      continue;
    }

    //更新观察者
    for (let i = 0, len = list.length;i < len;i++) {
      _commitVMPProp(i, list, item, newValue);
    }
  }
  updateList = [];
}

/**
 * 提交vmp属性变动
 * @param {Number} index [required] 在某个属性的观察者列表中的索引
 * @param {Array} list [required] 某个属性的观察者列表，注意到这一步，列表应该是经过非空检查的
 * @param {String} propName [required] 属性名
 * @param {*} newValue [required] 属性新的值
 */
function _commitVMPProp(index, list, propName, newValue) {
  let watcher = list[index];
  let value = newValue;
  let vmp = vmpList[watcher.id];

  if (typeof watcher.update === 'function') {
    let canUse = vmp && vmp.master;
    if (!canUse) {
      if (_debug) {
        console.error("In WatchManager _commitVMPProp(),vmp/vmp.master,not right.", `vmp:`, vmp);
      }
      return;
    }

    let t = watcher.update.call(vmp.master, newValue, NO_BIND);

    if (t === NO_BIND) {
      //如果只想监控属性的变化，但是不想将它绑定到vm.data上，就返回NO_BIND。
      if (_debug) {
        console.log(`In WatchManager _commitVMPProp(), ${vmp.master.route}'s vmp.watch set ${propName} no bind.`);
      }
      return;
    }

    // if (t !== void 0 && t !== null) {
    if (!isNothing(t)) {
      value = t;
    }

  } else if (_debug) {
    console.warn(`In WatchManager _commitVMPProp(),
          the ${propName} is not set update or the update's type is not function.
          If you need update the value before use vm.setData(),you should check.
          If not,do not care about this.`);
  }

  //do vmp commit
  if (vmp) {
    vmp.commit(propName, value);
  } else if (_debug) {
    console.warn("In WatchManager updateWatcher(),can not commit,because vmp is error,", vmp, propName, value);
  }
}

//only for debug
function _outputStateRefresh() {
  if (!_debug) {
    return;
  }
  const state = _store.state;
  console.info("Now,the state refreshed=====>");
  console.log(state);
  // console.log(watcherList,updateList);
  console.log("<============================>");
}

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
/**
 * @private
 * @description 将需要更新属性名加入属性队列
 * @param {*} propName
 * @param {*} watcherList
 * @param {*} updateList
 */
function enqueueUpdate(propName, watcherList, updateList) {
  let list;
  if (typeof propName !== 'string' || updateList.indexOf(propName) !== -1 || !(list = watcherList[propName])) {
    return false;
  }

  if (list.length <= 0) {
    if (_debug) {
      console.info(
        "In WM commit(),there is no vmp watcher the prop===>",
        watcherList[propName],
        propName,
        watcherList
      );
    }

    watcherList[propName] = null;
    return false;
  }

  updateList[updateList.length] = propName;
  return true;
}
//===========================================
//初始化标识
let initialized = false;

/**
 * @private
 * 内部使用的watcher化函数
 * @param {String} vmpId [required] vmp id
 * @param {Function} updateFn [required] 属性更新函数
 *
 * @return { {vmo_id$:String,update:Function} }
 *
 * ```
 * <code>
 * {
 *    vmo_id$:vmpId,    //用于调取vmp，然后应用属性值
 *    update:updateFn,  //fn，用于在最后提交到vmp进行处理前，进行更新的回调。this值，应该页面或组件的this
 * }
 * </code>
 * ```
 */
function be_watcherify(vmpId, updateFn) {
  let watcher = {};
  watcher.id = vmpId;
  if (typeof updateFn === 'function') {
    watcher.update = updateFn;
  }
  return watcher;
}
/**
 * @internal
 * 立即将当前state分支中相关的值
 * 在vmp中生效。
 * @param {VMProxy} vmp [required] vmp对象实例
 * @param {Array} props [required] 监控的属性数组
 * @param {Ojbect} getters [required] redux getters
 */
function be_validateCurrentValues(vmp, props, getters) {
  if (!getters || !vmp || !props) {
    return;
  }
  // let len = props.length;
  for (let i = 0, item; (item = props[i]) != null; i++) {
    let key = item.prop;
    let update = item.update;
    let o = getters[key];
    //不需要初始化值的跳过
    if (typeof item.initGet === "boolean" && !item.initGet) {
      continue;
    }

    if (typeof update !== 'function' && vmp) {
      vmp.commit(key, o);
      continue;
    }

    let t = update.call(vmp.master, o, NO_BIND);
    if (t === NO_BIND) {
      continue;
    }
    if (!isNothing(t)) {
      o = t;
    }
    // if (t !== void 0 && t !== null) {
    //   o = t;
    // }

    vmp.commit(key, o);
  }
}
//===========================================
export default {
  /**
   * @public
   * 开启/关闭 debug模式
   */
  set debug(value) {
    _debug = value;
  },
  get debug() {
    return _debug;
  },
  /**
   * @public
   *
   * 启动WM
   * @param {Object} store [required] store对象
   */
  setup(store) {
    if (initialized) {
      return;
    }

    _store = store;

    //监听state树变化
    subscribeState();

    if (_debug) {
      _outputStateRefresh();
    }

    initialized = true;
  },

  /**
   * @public
   *
   * watcher化函数，
   * 可以将属性等参数转化为watcher对象
   * @param {Object} vmp ViewModuleProxy
   * @param {Array} list 属性集合
   *
   * @return { {vmp:VMProxy,prop:String,update:Function}[] }
   *
   * ```
   * <code>
   *  {
   *   vmp:vmp,
   *    prop:'groupList',
   *    update:function(){},
   *  }
   *
   * </code>
   *
   * ```
   */
  watcherify(vmp, list) {
    let len = list.length;
    let item;
    let back = [];
    while (len--) {
      item = list[len];
      if (!item) {
        if (_debug) {
          console.error('In WatchManager watcherify(),the element in list is error', len, item);
        }
        continue;
      }

      if (isObject(item)) {
        back[len] = {
          vmp: vmp,
          prop: item.prop,
          update: item.update,
          initGet: typeof item.initGet === "boolean" ? item.initGet : true,
        };
      } else if (typeof item === 'string') {
        back[len] = {
          vmp: vmp,
          prop: item,
        };
      }
    }
    return back;
  },

  /**
   * @public
   *
   * 添加观察者
   * @param {Array} watchers [required] 观察者集合
   */
  addWatchers(...watchers) {
    if (!initialized) {
      if (_debug) {
        console.warn("WatchManager is not be initialized.");
      }
      return false;
    }
    let len = watchers.length;
    let watcher, prop, list, vmp;
    while (len--) {
      watcher = watchers[len];
      vmp = watcher.vmp;
      prop = watcher.prop;
      list = watcherList[prop];
      if (!list) {
        list = [];
        watcherList[prop] = list;
      }
      vmpList[vmp.id] = vmp;
      list[list.length] = be_watcherify(watcher.vmp.id, watcher.update);
    }
    // if(_debug){
    //   console.info('after add watchers,the watcher list is====>',watcherList);
    //   console.info('after add vmp the vmpList is====>',vmpList);
    // }
  },

  /**
   * @internal
   * 本方法仅供内部使用
   * 请不要擅自调用该方法
   * 以免发生错误
   */
  be_validateCurrentValues,
  /**
   * @public
   *
   * 移除观察者
   * @param {Object} vmp [required] 移除对vmp提交的属性监控
   * @param {String} propName [required] 属性名称
   */
  removeWatcher(vmp, propName) {

    let list = watcherList[propName];
    if (!list || list.length <= 0) {
      return propName;
    }

    list = list.filter(function (item) {
      return item.id !== vmp.id;
    });

    watcherList[propName] = list;

    if (list.length <= 0) {
      return propName;
    }

  },
  /**
   * @public
   *
   * 移除所有和此vmp实例有关的观察者
   * @param {ViewModleProxy} vmp
   */
  removeAllByVMP(vmp) {
    if (!vmp || !vmpList[vmp.id]) {
      return;
    }
    let keys = Object.keys(watcherList);
    let len = keys.length;
    let newList = {};

    while (len--) {
      let propName = keys[len];
      let isEmpty = this.removeWatcher(vmp, keys[len]);

      if (!isEmpty) {
        newList[propName] = watcherList[propName];
      }

    }
    vmpList[vmp.id] = void 0;

    //净化数据
    watcherList = newList;
  },
  /**
   * @public
   *
   * 提交属性变动
   * 当state树发生变化，将发生变化的属性键名提交
   * wm会组成变化集合数组，然后逐一更新观察者们
   *
   * @param {String} propName [required] 属性名
   */
  commit(propName) {
    enqueueUpdate(propName, watcherList, updateList);
  },
  /**
   * @description 提交一个由属性名组成的数组，用以更行对应的watchers
   * @param {*} propList
   */
  commitProps(propList = []) {
    for (let value of propList) {
      enqueueUpdate(value, watcherList, updateList);
    }
  },
  /**
   * WM进行销毁操作
   * 销毁不同于重置，
   * 是达到完全解除引用，完全不能再用的状态。
   */
  destroy() {
    //解除对state树的订阅
    unsubscribeStateUpadte();
    //去除相关属性引用
    _store = null;
    vmpList = null;
    watcherList = null;
    updateList = null;
    initialized = false;
  }
};
