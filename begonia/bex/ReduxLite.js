/**
 * 简版Redux
 * @author Brave Chan on 2017.7.9
 */
//=======================================
let store;
let cbList = [];
//========================================
/**
 *
 * Store类
 * 每个redux应用都只包含一个Store实例和一个reducer
 */
class Store {
  constructor(reducer, state = {}) {
    this._state = state;
    this._reducer = reducer;
  }
  /**
   * @public
   * @description 派发一个action
   * @param type {String} action类型
   * @param data {Object} action数据
   */
  dispatch = (type = '', payload = {}) => {
    this._state = this._reducer(this._state, { type, payload });
    trigger();
  }
  /**
   * @public
   * @description 返回store中的state对象或state树
   */
  get state() {
    return this._state;
  }

  get rootState() {
    return this._state.root;
  }
  /**
   * @public
   * @description 订阅state变化
   *
   * @param listener {Function} [required] 监听变化的回调函数
   *
   * @return {Function} 取消订阅的方法
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      return;
    }
    if (cbList.indexOf(listener) === -1) {
      cbList[cbList.length] = listener;
    }

    return (function (fn) {
      return function () {
        cbList = cbList.filter(item => item !== fn);
      }
    })(listener);
  }
}
/**
 * @private
 * @description 触发变化监听
 */
function trigger() {
  cbList.forEach(listener => {
    if (typeof listener === 'function') {
      listener();
    }
  });
}

//==============================================
/**
 * @public
 * @description 创建store实例
 */
function createStore(reducer, state = {}) {
  if (store) {
    return store;
  }

  if (!reducer || typeof reducer !== 'function') {
    throw new Error('In createStore(),the param reducer must be type of function.');
  }

  store = new Store(reducer, state);

  return store;
}
/**
 * @public
 * @description 将多个reducer组成的reducer树合成为一个根级reducer函数
 */
function combineReducers(reducers) {
  if (!reducers) {
    return;
  }
  let keys = Object.keys(reducers);

  return function (state, action) {
    if (!state || !action) {
      return state;
    }

    let obj = {};

    let fn;
    for (let key of keys) {
      fn = reducers[key];
      if (fn && typeof fn === 'function') {
        obj[key] = fn(state[key], action);
      }
    }

    return obj;
  };
}

//==================================================
export default {
  createStore,
  combineReducers,
};






