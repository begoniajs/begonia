/**
 * begoina redux-lite (bex)
 * 
 * 提供bex的入口和基本功能
 * @version 0.2.0
 * @author Brave Chan on 2017.12
 */
//===================================================
import Redux from './ReduxLite';
import WM from './WatchManager';
//===================================================
let _store;
let _getters;
let _actions;
let _debug = true;
//===================================================
/**
 * @public
 * 
 * 创建一个store实例
 * @param {Object} opt 
 */
function createStore(opt){
    if(_store){
        return _store;
    }
    if(typeof opt.debug !== 'undefined'){
        _debug = opt.debug;
    }
    let [allReducers,getters,actions] = handleModules({},{},{},opt.modules,stateChanged);
    _actions = actions;
    let state = opt.state || {};
    let reducer = Redux.combineReducers(allReducers);
    _store = new Redux.createStore(reducer,state);
    
    _store.dispatch({});//考虑一下
    _getters = getters;

    WM.debug = _debug;
    WM.setup(_store,_getters);
    
    return _store;
}

/**
 * @public
 * 
 * 将需要的action析出
 * 
 * @param {Array} list [necessary] 需要的action函数名称集合
 * @return {Array} 
 */
function mapActions(list){
    if(!list || list.length<=0){
        return [];
    }
    let back = {};
    let len = list.length;
    let fn;
    while(len--){
        fn = _actions[list[len]];
        if(typeof fn === 'function'){
            back[list[len]] = fn;
        }else{
            if(_debug){
                console.error('The name in list who is param,is error====>index:',len,'function name:',list[len]);
            }            
        }
    }

    return back;
}

// 暂不提供
// function mapGetters(list){
//     return [];
// }

//=========================================================
/**
 * @public
 * 
 * 添加对一些state属性的观察
 * 用于包装器，请直接使用`vmp.watch()`
 * @param {Array} list [necessary] 属性配置列表
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
function watch(list,getValNow=true){
    if(list && list.length>0){        
        list = WM.watcherify(this,list);
        WM.addWatchers(...list);
        if(getValNow){
            //立即给这些观察的值应用state分支中对应属性的当前值。
            WM.be_validateCurrentValues(this,list,_getters);
        }        
    }
}
/**
 * @public
 * 
 * 接触一个属性的观察
 * 用于包装器，请直接使用`vmp.unwatch()`
 * @param {*} prop 
 */
function unwatch(prop){
    if(typeof prop === 'string'){
        WM.removeWatcher(this,prop);
    }
}
//=======================================================
/**
 * @private
 * 
 * 创建reducer函数的通用函数
 * 主要用来创建state分支的reducer
 * @param {Object} _state [necessary] 原始的state对象 
 * @param {Object} reducers [necessary] 分支reducer集合对象
 * 
 * @return {Function} reducer函数 
 */
function createReducer(_state={},reducers,cb){
    let outState = _state;
    let proxy = {};
    let tProxy = {
        get state(){
            return proxy;
        },
    };        
    let props = {};
    let keys = Object.keys(outState);
    for(let key of keys){
        props[key] = {
            set(value){
                if(value === outState[key]){
                    return;
                }
                outState = Object.assign({},outState,{[key]:value});
                cb(key);
            },
            get(){
                return outState[key];
            }
        };
    }
    Object.defineProperties(proxy,props);

    return function(state=_state,action){
        outState = state;
        let fn = reducers[action.type];
        if(typeof fn === 'function'){
            fn.call(null,tProxy.state,action);
        }        
        return outState;
    }
}

/**
 * @private
 * 
 * 创建分支getters
 * 将生成的get函数挂载在传入的backGetters参数上
 * 
 * @param {Object} backGetters [necessary] 挂载的对象 
 * @param {String} branch [necessary] 分支名 
 * @param {Object} getters [necessary] 原始的getters集合对象
 * 
 * @return {Function} 按照分支和get函数集合，生成每个属性的getter函数 
 */
function createGetters(backGetters={},branch,getters){

    return function(_branch=branch,_getters=getters){
        let keys = Object.keys(_getters);
        let props = {};
        for(let value of keys){
            props[value] = {
                get(){
                    return _getters[value](_store.getState()[_branch]);
                }
            };
        }
        // backGetters[branch] = {};
        // Object.defineProperties(backGetters[branch],props);
        Object.defineProperties(backGetters,props);
    }
}

/**
 * @private
 * 创建actions的函数
 * 此actions函数仅是由模块文件中actions字段产生的函数包装函数。
 * 并不是redux中的action
 */
function createAction(fn){
    
    return function(...args){
      let list = [_store,...args];
      fn.apply(this,list);
    }
}

/**
 * @private
 * 
 * 处理模块数据
 * @param {Object} allReducers [necessary] 最后导出的包含所有分支reducer的对象 
 * @param {Object} getters [necessary] 最后导出的包含所有分支的get函数的对象
 * @param {Object} actions [necessary] 最后导出的包含所有actions函数的集合
 * @param {Object} modules [necessary] 模块对象
 * 
 * @return {Array} [allReducers,getters] 
 */
function handleModules(allReducers,getters,actions,modules,changeCB){
    if(!modules){
        return allReducers;
    }
    let keys = Object.keys(modules);
    if(keys.length<=0){
        return allReducers;
    }

    let state,reducers,m;
    for(let value of keys){
        m = modules[value];
        state = m.state;
        reducers = m.reducers;
        if(!state || !reducers){
            continue;
        }
        allReducers[value] = createReducer(state,reducers,changeCB);
        handleGetters(getters,value,m.getters);
        handleActions(actions,value,m.actions);
    }
    return [allReducers,getters,actions];
}

/**
 * @private
 * 
 * 处理get函数集合
 * @param {Object} getters [neccessary] 加工并最后导出的get函数集合对象
 * @param {String} branch [neccessary] 分支名称
 * @param {Object} branchGetters [neccessary] 分支的get函数集合 
 */
function handleGetters(getters,branch,branchGetters){
    if(!branchGetters){
        return;
    }
    createGetters(getters,branch,branchGetters)();
}

/**
 * @private
 * 
 * 处理action函数集合
 * @param {Object} actions [neccessary] 加工并最后导出的actions函数集合
 * @param {Object} branchActions [neccessary] 模块中的actions函数集合 
 */
function handleActions(actions,branch,branchActions){
    if(!branchActions){
        return;
    }
    let keys = Object.keys(branchActions);
    if(keys.length<=0){
        return;
    }
    // actions[branch] = {};
    for(let value of keys){
        // actions[branch][value] = createAction(branchActions[value]);
        actions[value] = createAction(branchActions[value]);
    }
}

/**
 * @private
 * 
 * state分支属性变化回调
 * @param {String} key [necessary] 变化的分支属性键名 
 */
function stateChanged(key){
    if(_debug){
        console.info("The state has changed====>props:",key);
    }
    WM.commit(key);
}

//=======================================================
module.exports = {
    set debug(value){
        _debug = value;
        WM.debug = _debug;
    },
    get debug(){
        return _debug;
    },
    /**
     * @public
     * 系统创建的唯一store
     */
    get store(){
        return _store;
    },
    /**
     * @public
     * 可以通过getters访问state上的属性
     */
    get getters(){
        return _getters;
    },
    /**
     * @public
     * 可以通过actions访问state上的属性
     */
    get actions(){
        return _actions;
    },
    //=========================================================== 
    /**
     * @internal
     * 包装器，用于为VMP实例添加功能
     * @param {Object} vmp VMP的实例,
     * 在方法使用参数vmp前，begoina已经对vmp进行了验证。
     * 所以不必再重复验证。
     */
    decorator(vmp){
        Object.defineProperties(vmp,{
            '$store':{
                get(){
                    return _store;
                }
            },
            '$getters':{
                get(){
                    return _getters;
                }
            },
            '$actions':{
                get(){
                    return _actions;
                }
            },      
        });

        if(typeof vmp.watch === 'undefined'){
            vmp.watch = watch;
        }else{
            if(debug){
                console.error("In bex,when do decorate vmp,there is same key of watch in vmp already,please check.");
            }            
            return;
        }

        if(typeof vmp.unwatch === 'undefined'){
            vmp.unwatch = unwatch;
        }else{
            if(debug){
                console.error("In bex,when do decorate vmp,there is same key of unwatch in vmp already,please check.");
            }            
            return;
        }
        
    },
    /**
     * @internal
     * 启动bex
     * 由begoina主动调用
     * 不用手动调用
     */
    setup(){},
    /**
     * @internal
     * 清除绑定在vmp上的
     * 装饰器或者属性
     */
    clearVMP(vmp){
        WM.removeAllByVMP(vmp);
    },
    /**
     * @internal
     * 进行销毁bex的操作
     */
    destroy(){
        WM.destroy();
        _store = null;
        _getters = null;
        _actions = null;
    },
    //=========================================================== 
    /**
     * @public
     * 创建一个store实例
     * 注意当一个store实例创建时，将会成为单例。
     * 如果下次再调用该方法，仍然会返回上一次创建的实例。
     * 
     * @param {Object} opt [necessary] store的配置对象
     * 
     * @return {Object}
     */
    createStore,
    /**
     * @public
     * 
     * 将需要的action析出
     * 
     * @param {Array} list [necessary] 需要的action函数名称集合
     * @return {Array} 
     */
    mapActions,
}