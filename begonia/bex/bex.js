/**
 * begoina redux-lite (bex)
 *
 * 提供bex的入口和基本功能
 * @version 1.2.0
 * @author Brave Chan on 2019.5
 */
//===================================================
import Redux from './ReduxLite';
import WM from './WatchManager';
import { autoincrement, isFunction, isObject, isNothing } from './util';
//===================================================
let _store;
let _debug = true;
// id增长函数
let valueIdFn = autoincrement(1000, 1);
// 等待被释放的state集合
let waitFreeStates = { length: 0 };
/**
 * @private
 * @description state中属性的id集合
 * 存储格式遵循`"[branch]:...:[valueName]": valueId`
 */
let statePropIds = {};
/**
 * state分支属性观察者列表
 * {
 *    ["prop value id"]: {getterFnName1:true, ...}
 * }
 */
let stateObserverList = {};
//===================================================

/**
 * @private
 * @description 执行创建store实例
 * @param {Object} state 根级state
 * @param {Function} reducer 根级reducer函数
 * @param {Object} actions
 * @param {Object} getters
 *
 * @return {Object}
 */
function doCreateStore(state, reducer, actions, getters) {
  let store = Redux.createStore(reducer, state);
  Object.defineProperties(store, {
    getters: {
      get() {
        return getters;
      }
    },
    actions: {
      get() {
        return actions;
      }
    }
  });
  return store;
}

/**
 * @private
 *
 * @description 处理模块数据
 * @param {Object} allReducers [required] 最后导出的包含所有分支reducer的对象
 * @param {Object} getters [required] 最后导出的包含所有分支的get函数的对象
 * @param {Object} actions [required] 最后导出的包含所有actions函数的集合
 * @param {Object} modules [required] 模块对象
 *
 * @return {Array} [allReducers, getters, actions]
 */
function handleModules(allReducers = {}, getters = {}, actions = {}, modules = {}, changeCB = () => { }) {
  if (!modules) {
    return allReducers;
  }
  let keys = Object.keys(modules);
  if (keys.length <= 0) {
    return allReducers;
  }

  let state, reducers, m;
  for (let value of keys) {
    m = modules[value];
    state = m.state;
    reducers = m.reducers;
    if (!state || !reducers) {
      continue;
    }
    allReducers[value] = createReducer(state, reducers, changeCB, value);
    getters = handleGetters(getters, value, m.getters);
    actions = handleActions(actions, value, m.actions);
  }
  return [allReducers, getters, actions];
}
// =============================================================
/**
 * @private
 *
 * @description 处理get函数集合
 * @param {Object} getters [required] 加工并最后导出的get函数集合对象
 * @param {String} branch [required] 分支名称
 * @param {Object} branchGetters [required] 分支的get函数集合
 * @return {Object} getters
 */
function handleGetters(getters, branch, branchGetters) {
  if (!branchGetters || !branch) {
    return getters;
  }
  Object.defineProperties(getters, createGetters(branch, branchGetters));
  return getters;
}

/**
 * @private
 *
 * @description 创建分支getters
 * 将生成的get函数挂载在传入的backGetters参数上
 *
 * @param {String} branch [required] 分支名
 * @param {Object} getters [required] 原始的getters集合对象
 *
 * @return {Function} 按照分支和get函数集合，生成每个属性的getter函数
 */
function createGetters(branch, getters) {
  let keys = Object.keys(getters);
  let props = {};
  for (let value of keys) {
    props[value] = {
      get() {
        let fn = getters[value];
        let branchState = _store.state[branch];
        if (!fn.binding) {
          let observableState = handleObservableBranch(
            defineObservableBranch(branchState, value, branch),
            value,
            waitFreeStates
          );
          fn.binding = true;
          if (_debug) {
            console.warn(`The branch ${branch} all props add a watcher ${value}`);
          }

          return fn(observableState, _store.getters);
        } else if (waitFreeStates[value]) {
          freeObservableBranch(value, waitFreeStates);
        }

        return fn(branchState, _store.getters);
      }
    };
  }
  return props;
}

/**
 * @private
 *
 * @description 加工可观察分支
 * @param {Object} observableState 可观察的state分支
 * @param {Object} waitFreeStates 等待释放的state集合
 * @returns {Object} observableState 可观察的state分支
 */
function handleObservableBranch(observableState, value, waitFreeStates) {
  waitFreeStates[value] = observableState;
  waitFreeStates.length++;
  return observableState;
}

/**
 * @private
 * @description 定义可被观察的state分支和属性
 * 如果state中的属性被某个getter时候，将会产生绑定关系
 * 当state中的分支更新时，将会影响到getter的再次调用
 * @param {Object} branchState state分支对象
 * @param {String} getterName 属性名称
 * @param {String} branch 分支名称
 */
function defineObservableBranch(branchState, getterName, branch) {
  let props = {};
  let observableState = {};
  let keys = Object.keys(branchState);
  for (let value of keys) {
    let valueId = statePropIds[`${branch}:${value}`];
    props[value] = {
      get() {
        addStateValueWatcher(getterName, valueId);
        return branchState[value];
      }
    };
  }

  return Object.defineProperties(observableState, props);
}

/**
 * @private
 * @description 释放可被观察的state分支及其属性
 * 当getter已经与state中的属性建立响应关系时，
 * 可以释放被观察的state分支
 * @param {String} oStateName 可观察state分支对象名称
 */
function freeObservableBranch(oStateName, waitFreeStates) {
  let observableState = waitFreeStates[oStateName];
  let keys = Object.keys(observableState);
  for (let value of keys) {
    observableState[value] = null;
  }

  waitFreeStates[oStateName] = null;
  waitFreeStates.length--;
  if (waitFreeStates.length <= 0) {
    waitFreeStates = { length: 0 };
  }
  if (_debug) {
    console.warn('free a observable branch', oStateName, waitFreeStates);
  }
}

/**
 * @private
 * @description 添加对某个state分支属性的观察者
 * @param {String} getterName
 * @param {Number} valueId
 */
function addStateValueWatcher(getterName, valueId) {
  if (!stateObserverList[valueId]) {
    stateObserverList[valueId] = {};
  }
  let list = stateObserverList[valueId];
  if (!!list[getterName]) {
    return;
  }
  if (_debug) {
    console.warn(`The state prop valueId ${valueId} will bind with ${getterName}`);
  }

  list[getterName] = true;
}
// =============================================================
/**
 * @private
 *
 * @description 处理action函数集合
 * @param {Object} actions [required] 加工并最后导出的actions函数集合
 * @param {Object} branchActions [required] 模块中的actions函数集合
 * @returns {Object} actions
 */
function handleActions(actions, branch, branchActions) {
  if (!branchActions) {
    return actions;
  }
  let keys = Object.keys(branchActions);
  if (keys.length <= 0) {
    return actions;
  }
  for (let value of keys) {
    actions[value] = createAction(branchActions[value]);
  }
  return actions;
}

/**
 * @private
 * @description 创建actions的函数
 * 此actions函数仅是由模块文件中actions字段产生的函数包装函数。
 * 并不是redux中的action
 * @returns {Function}
 */
function createAction(fn) {
  return function (...args) {
    return fn.apply(this, [_store, ...args]);
  }
}
// =============================================================
/**
 * @private
 *
 * @description 创建reducer函数的通用函数 主要用来创建state分支的reducer
 * @param {Object} _state [required] 原始的state对象
 * @param {Object} reducers [required] 分支reducer集合对象
 *
 * @return {Function} reducer函数
 */
function createReducer(_state = {}, reducers, cb, branch) {
  let outState = _state;
  let proxy = {};
  let tProxy = {
    get state() {
      return proxy;
    },
  };
  let props = {};
  let keys = Object.keys(outState);
  for (let key of keys) {
    statePropIds[`${branch}:${key}`] = valueIdFn(); // 存入valueIds
    props[key] = {
      set(value) {
        if (value === outState[key]) {
          return;
        }
        outState = Object.assign({}, outState, { [key]: value });
        cb(key, branch); // emit state value change event.
      },
      get() {
        return outState[key];
      }
    };
  }
  Object.defineProperties(proxy, props);

  return function (state = _state, action) {
    outState = state;
    if (action.type === 'be_sys') {
      return outState;
    }
    let fn = reducers[action.type];
    if (typeof fn === 'function') {
      fn.call(null, tProxy.state, action.payload);
    }
    return outState;
  }
}

/**
 * @private
 *
 * @description state分支属性变化回调
 * @param {String} key [required] 变化的分支属性键名
 * @param {String} branch [required] state的分支名
 */
function stateChanged(key, branch) {
  let statePath = `${branch}:${key}`;
  let valueId = statePropIds[statePath];
  let getterNames = stateObserverList[valueId] || {};
  let list = Object.keys(getterNames);
  if (_debug) {
    console.info("The state has changed====>props:", statePath, valueId, getterNames);
    console.info('and these properties will be updated====>', list);
  }

  WM.commitProps(list);
}

/**
 * @private
 * @description 处理getter监控属性，将对象形式转为数组形式
 * @param {Object} list
 */
function handleMapGetterObj(list = {}) {
  return Object.entries(list)
    .map(function (item) {
      let key = item[0];
      let value = item[1];
      if (key === value && typeof value === 'string') {
        return value;
      }

      if (isFunction(value)) {
        return {
          prop: key,
          update: value
        };
      }

      if (isObject(value)) {
        return Object.assign({}, value, { prop: key });
      }
    });
}

/**
 * @private
 * @description 处理getter监控属性，将数组形式转换为对象形式
 * @param {Array} list
 * @param {Boolean} getValueNow
 * @returns {Object}
 */
function handleMapGetterAry(list = [], getValueNow = true) {
  return list.reduce(function(prev, item) {
    if (typeof item === 'string') {
      prev[item] = {
        prop: item,
        initGet: getValueNow
      };
      return prev;
    }

    if (isObject(item)) {
      prev[item.prop] = Object.assign({}, item, { initGet: item.initGet === void 0 ? getValueNow : item.initGet });
      return prev;
    }
  }, {});
}

//=======================================================
/**
 * @public
 *
 * @description 创建一个store实例
 * @param {Object} opt 设置
 * @returns {Object} store实例
 */
function createStore(opt = {}) {
  if (_store) {
    return _store;
  }
  _debug = !!opt.debug;
  opt.modules = opt.modules || {};
  opt.modules.root = {
    state: opt.state || {},
    getters: opt.getters || {},
    actions: opt.actions || {},
    reducers: opt.reducers || {}
  };

  let [allReducers, getters, actions] = handleModules({}, {}, {}, opt.modules, stateChanged);
  _store = doCreateStore(
    {},
    Redux.combineReducers(allReducers),
    actions,
    getters
  );
  // init 考虑一下
  _store.dispatch('be_sys');

  WM.setup(_store);

  return _store;
}

/**
 * @public
 *
 * @description 将需要的action析出
 *
 * @param {Array} list [required] 需要的action函数名称集合
 * @return {Object} 由选择的action组成的集合
 */
export function mapActions(list) {
  if (!list || list.length <= 0) {
    return [];
  }
  let back = {};
  let len = list.length;
  let fn;
  while (len--) {
    fn = _store.actions[list[len]];
    if (typeof fn === 'function') {
      back[list[len]] = fn;
    } else {
      if (_debug) {
        console.error('The name in list who is param,is error====>index:', len, 'function name:', list[len]);
      }
    }
  }

  return back;
}

/**
 * @public
 * @description 将需要的getter析出
 * @param { Object | Array<Object|String> } list
 * @returns {Object}
 */
export function mapGetters(list = [], getValueNow = true) {
  return Array.isArray(list) ? handleMapGetterAry(list, getValueNow) : list;
}

//=========================================================
/**
 * @public
 *
 * @description 添加对一些state属性的观察, 用于包装器，请直接使用`vmp.watch()`
 * @param {Array} list [required] 属性配置列表
 * @param {Boolean} getValNow [optional] 是否立即使用当前state分支中的
 * 对应值去更新指定属性列表中的属性值。
 *
 * 默认是`true`,开启这项功能。
 * 会在为属性添加了观察者之后，就会立即以当前`state`分支中的对应属性值
 * 更新第一个参数中指定的那些属性。
 *
 * 如果是`false`,则那么直到观察到数据发生变化之前，
 * 都不会去更新指定的那些属性。
 */
function watch(list, getValNow = true) {
  if (list && list.length > 0) {
    list = WM.watcherify(this, list);
    WM.addWatchers(...list);
    if (getValNow) {
      //立即给这些观察的值应用state分支中对应属性的当前值。
      WM.be_validateCurrentValues(this, list, _store.getters);
    }
  }
}
/**
 * @public
 *
 * @description 接触一个属性的观察, 用于包装器，请直接使用`vmp.unwatch()`
 * @param {String} prop [required] 属性名
 */
function unwatch(prop) {
  if (typeof prop === 'string') {
    WM.removeWatcher(this, prop);
  }
}
//=======================================================
export default {
  set debug(value) {
    _debug = value;
    WM.debug = _debug;
  },
  get debug() {
    return _debug;
  },
  /**
   * @public
   * 系统创建的唯一store
   */
  get store() {
    return _store;
  },
  /**
   * @public
   * 可以通过getters访问state上的属性
   */
  get getters() {
    return _store.getters;
  },
  /**
   * @public
   * 可以通过actions访问state上的属性
   */
  get actions() {
    return _store.actions;
  },
  //===========================================================
  /**
   * @internal
   * @description 解析原始声明式对象
   * @param {Object} data 原始声明式对象
   * @param {Number} be_nodeType 节点类型
   */
  originParse(data, be_nodeType) {
    // 针对component内部机制，将observed放入一个函数闭包内返回。
    if (be_nodeType === 3) {
      data.methods = data.methods || {};
      Object.assign(data.methods, {
        ['bex_observed']: (function(observed) {
          return function(key) {
            if (key!=='bex') {
              console.warn('Please do not invoke thie internal methods, beacuse `component` need a instance observed.');
              return;
            }
            return observed;
          };
        })(data.observed)
      });
    }
  },
  /**
   * @internal
   * @description 解析宿主的配置，并附加功能以及预处理部分功能
   * @param {Object} master 宿主，即小程序实例对象
   * @param {Object} vmp 代理对象
   */
  parse(master, vmp) {
    // 针对component内部机制，将be_observed()返回的oberved挂载在master上
    if (master.be_nodeType === 3 && isFunction(master.bex_observed)) {
      master.observed = master.bex_observed('bex');
    }
    let observed = master.observed;
    if (!observed) {
      console.warn('can not find the master.observed', master);
      return;
    }
    watch.apply(vmp, [Array.isArray(observed) ? observed : handleMapGetterObj(observed)]);
  },
  /**
   * @internal
   * @description 包装器，用于为VMP实例添加功能
   * @param {Object} vmp VMP的实例,
   * 在方法使用参数vmp前，begoina已经对vmp进行了验证。
   * 所以不必再重复验证。
   */
  decorate(master, vmp) {
    Object.defineProperties(master, {
      '$store': {
        get() {
          return _store;
        }
      },
      '$getters': {
        get() {
          return _store.getters;
        }
      },
      '$actions': {
        get() {
          return _store.actions;
        }
      },
    });

    if (isNothing(vmp.watch)) {
      vmp.watch = watch;
    } else {
      if (_debug) {
        console.error("In bex,when do decorate vmp,there is same key of watch in vmp already,please check.");
      }
      return;
    }

    if (isNothing(vmp.unwatch)) {
      vmp.unwatch = unwatch;
    } else {
      if (_debug) {
        console.error("In bex,when do decorate vmp,there is same key of unwatch in vmp already,please check.");
      }
      return;
    }

  },
  /**
   * @internal
   * @description 启动bex
   * 由begoina主动调用
   * 不用手动调用
   */
  setup() { },
  /**
   * @internal
   * @description 清除绑定在vmp上的
   * 装饰器或者属性
   */
  wash(master, vmp) {
    WM.removeAllByVMP(vmp);
  },
  /**
   * @internal
   * @description 进行销毁bex的操作
   */
  destroy() {
    WM.destroy();
    _store = null;
  },
  //===========================================================
  /**
   * @public
   * @description 创建一个store实例
   * 注意当一个store实例创建时，将会成为单例。
   * 如果下次再调用该方法，仍然会返回上一次创建的实例。
   *
   * @param {Object} opt [required] store的配置对象
   *
   * @return {Object}
   */
  createStore,
};
