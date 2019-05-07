/**
 * 观察者管理
 * @version 0.2.0
 * @author Brave Chan on 2017.12
 */
//===========================================================
import be_const from './beconst';
//============================================================
//不绑定标识，用于表明不将某个属性使用setData()绑定到小程序实例的data上
const NO_BIND = `|@^o^noBind${new Date().getTime()}@|`;

//调试模式开关
let _debug = false;

//监控state属性引用和值集合
let origin = {};


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
let _getters;   //redux getters

//解除订阅state变化的函数
let unsubscribeStateUpadte;
//===========================================
/**
 * @private
 * 订阅state树变动
 */
function subscribeState(){
  unsubscribeStateUpadte = _store.subscribe(stateUpdateHandler);
}

/**
 * @private
 * state更新处理器
 */
function stateUpdateHandler(){  

  if(_debug){
    _outputStateRefresh();
  }
  
  updateWatcher();
  
}

/**
 * @private
 * 更新监控属性变化的观察者们
 */
function updateWatcher(){
  if(updateList.length<=0){
    return;
  }
  let len = updateList.length;
  let list;
  
  for(let i=0,item;(item=updateList[i])!=null;i++){
    let newValue = _getters[item];

    //比较引用或值
    if(origin[item] === newValue){
      continue;
    }

    if(_debug){
      console.info(`Now,the ${item} will updata in WatchManager=======>`,newValue);
    }

    //存储新值的引用
    origin[item] = newValue;

    //开始提交vmp属性变动
    list = watcherList[item];
    if(!list || list.length===0){
      continue;
    }

    //更新观察者
    let len = list.length;
    while(len--){
      _commitVMPProp(len,list,item,newValue);      
    }

  }

  updateList = [];
}

/**
 * 提交vmp属性变动
 * @param {Number} index [necessary] 在某个属性的观察者列表中的索引  
 * @param {Array} list [necessary] 某个属性的观察者列表，注意到这一步，列表应该是经过非空检查的
 * @param {String} propName [necessary] 属性名
 * @param {*} newValue [necessary] 属性新的值
 */
function _commitVMPProp(index,list,propName,newValue){
    let watcher = list[index];
    let value = newValue;
    let vmp = vmpList[watcher[be_const.VM_ID]];

    if(typeof watcher.update === 'function' ){
        let canUse = vmp && vmp._vm && vmp._vm.principal;
        if(!canUse){
          if(_debug){
            console.error("In WatchManager _commitVMPProp(),vmp/vm/principal,not right.",`vmp:`,vmp);
          }            
          return;
        }

        let t = watcher.update.call(vmp._vm.principal,newValue,NO_BIND);
        
        if(t === NO_BIND){
          //如果只想监控属性的变化，但是不想将它绑定到vm.data上，就返回NO_BIND。
          if(_debug){              
            console.log(`In WatchManager _commitVMPProp(), ${vmp._vm.principal.route}'s vmp.watch set ${propName} no bind.`);
          }
          return;
        }

        if(t !== void 0 && t !== null){
          value = t;
        }

      }else if(_debug){
        console.warn(`In WatchManager _commitVMPProp(),
          the ${propName} is not set update or the update's type is not function.
          If you need update the value before use vm.setData(),you should check.
          If not,do not care about this.`);
      }
      
      //do vmp commit
      if(vmp){
        vmp.commit(propName,value);
      }else if(_debug){
        console.warn("In WatchManager updateWatcher(),can not commit,because vmp is error,",vmp,propName,value);
      }
}

//only for debug
function _outputStateRefresh(){
  const state = _store.getState();
  console.info("Now,the state refreshed=====>");
  console.log(state);
  // console.log(watcherList,updateList);
  console.log("<============================>");
}

function isObject(value){
  return Object.prototype.toString.call(value) === '[object Object]';
}

//===========================================
//初始化标识
let initialized = false;

/**
 * @private
 * 内部使用的watcher化函数
 * @param {String} vmpId [necessary] vmp id
 * @param {Function} updateFn [necessary] 属性更新函数
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
function be_watcherify(vmpId,updateFn){
  let watcher = {};
  watcher[be_const.VM_ID] = vmpId;
  if(typeof updateFn === 'function'){
    watcher.update = updateFn;
  }
  return watcher;
}
/**
 * @internal
 * 立即将当前state分支中相关的值
 * 在vmp中生效。
 * @param {VMProxy} vmp [necessary] vmp对象实例
 * @param {Array} props [necessary] 监控的属性数组
 * @param {Ojbect} getters [necessary] redux getters 
 */
function be_validateCurrentValues(vmp,props,getters){
  if(!getters || !vmp || !props){
    return;
  }
  let len = props.length;
  for(let i=0,item;(item=props[i])!=null;i++){
    let key = item.prop;
    let update = item.update;
    
    //不需要初始化值的跳过
    if(typeof item.initGet === "boolean" && !item.initGet){
      continue;
    }

    let o = getters[key];

    if(typeof update !== 'function' && vmp){
      vmp.commit(key,o);
      continue;
    }
    
    let t = update.call(vmp._vm.principal,o,NO_BIND);
    if(t === NO_BIND){
      continue;
    }
    
    if(t !== void 0 && t !== null){
      o = t;
    }
    
    if(vmp){
      vmp.commit(key,o);
    }    
  }
}
//===========================================
export default {
  /**
   * @public
   * 开启/关闭 debug模式
   */
  set debug(value){
    _debug = value;
  },
  get debug(){
    return _debug;
  },
  /**
   * @public
   * 
   * 启动WM
   * @param {Object} store [necessary] store对象
   * @param {Object} getters [necessary] getters对象
   */
  setup(store,getters){
    if(initialized){
      return;
    }

    _store = store;
    _getters = getters;
    
    //监听state树变化
    subscribeState();
    
    if(_debug){
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
  watcherify(vmp,list){
    let len = list.length;
    let item;
    let back = [];
    while(len--){
      item = list[len];
      if(!item){
        if(_debug){
          console.error('In WatchManager watcherify(),the element in list is error',len,item);
        }        
        continue;
      }

      if(isObject(item)){
        back[len] = {
          vmp:vmp,
          prop:item.prop,
          update:item.update,
          initGet:typeof item.initGet === "boolean"?item.initGet:true,
        };
      }else if(typeof item === 'string'){
        back[len] = {
          vmp:vmp,
          prop:item,
        };
      }
    }
    return back;
  },

  /**
   * @public
   * 
   * 添加观察者
   * @param {Array} watchers [necessary] 观察者集合
   */
  addWatchers(...watchers){
    if(!initialized){
      if(_debug){
        console.info("WatchManager is not be initialized.");
      }      
      return false;
    }
    const VM_ID = be_const.VM_ID;
    let len = watchers.length;
    let watcher,prop,list,vmp;
    while(len--){
      watcher = watchers[len];
      vmp = watcher.vmp;
      prop = watcher.prop;
      list = watcherList[prop];
      if(!list){
        list = [];
        watcherList[prop] = list;
        origin[prop] = _getters[prop];
      }
      vmpList[vmp[VM_ID]] = vmp;
      list[list.length] = be_watcherify(watcher.vmp[be_const.VM_ID],watcher.update);
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
   * @param {Object} vmp [necessary] 移除对vmp提交的属性监控 
   * @param {String} propName [necessary] 属性名称
   */
  removeWatcher(vmp,propName){

    let list = watcherList[propName];
    if(!list || list.length<=0){
      return propName;
    }

    list = list.filter(function(item,index){
      return item[be_const.VM_ID] !== vmp[be_const.VM_ID];
    });

    watcherList[propName] = list;
    
    if(list.length<=0){
      return propName;
    }
  
  },
  /**
   * @public
   * 
   * 移除所有和此vmp实例有关的观察者
   * @param {ViewModleProxy} vmp 
   */
  removeAllByVMP(vmp){
    const VM_ID = be_const.VM_ID;
    if(!vmp || !vmpList[vmp[VM_ID]]){
      return;
    }
    let keys = Object.keys(watcherList);
    let len = keys.length;
    let newList = {};
  
    while(len--){
      let propName = keys[len];
      let isEmpty = this.removeWatcher(vmp,keys[len]);

      if(!isEmpty){
        newList[propName] = watcherList[propName];
      }
     
    }
    vmpList[vmp[VM_ID]] = void 0;
    
    //净化数据
    watcherList = newList;
    let useKeys = Object.keys(watcherList);
    let newOrigin = {};
    for(let value of useKeys){
      if(origin[value] !== void 0){
        newOrigin[value] = origin[value];
      }
    }
    origin = newOrigin;
    
  },
  /**
   * @public
   * 
   * 提交属性变动
   * 当state树发生变化，将发生变化的属性键名提交
   * wm会组成变化集合数组，然后逐一更新观察者们
   * 
   * @param {String} propName [necessary] 属性名 
   */
  commit(propName){
    if(typeof propName !== 'string' || updateList.indexOf(propName)!==-1){
      return;
    }

    let list = watcherList[propName];
    if(!list){
      return;
    }

    if(list.length<=0){

      if(_debug){
        console.info("In WM commit(),there is no vmp watcher the prop===>",watcherList[propName],propName,watcherList);
      }

      if(origin[propName] !== void 0){
        origin[propName] = void 0;
      }
      watcherList[propName] = void 0;
      return;
    }

    updateList[updateList.length] = propName;
  },
  /**
   * WM进行销毁操作
   * 销毁不同于重置，
   * 是达到完全解除引用，完全不能再用的状态。
   */
  destroy(){
    //解除对state树的订阅
    unsubscribeStateUpadte();
    //去除相关属性引用
    _store = null;
    _getters = null;
    origin = null;
    vmpList = null;
    watcherList = null;
    updateList = null;
    initialized = false;
  }
};