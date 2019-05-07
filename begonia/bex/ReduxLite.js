/**
 * 简版Redux
 * @author Brave Chan on 2017.7.9
 */
//=======================================
let _state;

let _reducer;

let store;
let cbList = [];
let dispatchTimer;
//========================================
/**
 * 
 * Store类
 * 每个redux应用都只包含一个Store实例和一个reducer
 */
class Store{
  constructor(reducer,state={}){
    _state = state;
    _reducer = reducer;
  }
  /**
   * @public
   * 派发一个action
   */
  dispatch(action){
    _state = _reducer(_state,action);
    trigger();
  }
  /**
   * @public
   * 返回store中的state对象或state树
   */
  getState(){
    return _state;
  }
  /**
   * @public
   * 订阅state变化
   * 
   * @param listener {Function} [necessary] 监听变化的回调函数
   * 
   * @return {Function} 取消订阅的方法
   */
  subscribe(listener){
    if (!typeof listener === 'function'){
      return;
    }
    if(cbList.indexOf(listener)===-1){
      cbList[cbList.length] = listener;
    }

    return function(fn){
      return function(){
        cbList = cbList.filter(item => item !== fn);
      }
    }(listener);
  }
}
/**
 * @private
 * 触发变化监听
 */
function trigger(){
  cbList.forEach(listener => {
    if (typeof listener === 'function') {
      listener();
    }
  });
}

//==============================================
/**
 * @public
 * 创建store实例
 */
function createStore(reducer,state={}){
  if(store){
    return store;
  }

  if(!reducer || typeof reducer !== 'function'){
    throw new Error('In createStore(),the param reducer must be type of function.');
  }

  store = new Store(reducer,state);

  return store;
}
/**
 * @public
 * 将多个reducer组成的reducer树合成为一个根级reducer函数
 */
function combineReducers(reducers){
  if(!reducers){
    return;
  }
  let keys = Object.keys(reducers);

  return function(state,action){
    if(!state || !action){
      return state;
    }

    let obj = {};
    
    let fn;
    for(let key of keys){
      fn = reducers[key];
      if(fn && typeof fn === 'function'){
        obj[key] = fn(state[key],action);        
      }
    }
    
    return obj;

  };
}

//==================================================
module.exports = {
  createStore,
  combineReducers,
};






