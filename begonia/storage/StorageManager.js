/**
 * 缓存管理
 * @author Brave Chan on 2017.8.23
 */
//=====================================================

//==========================预设的缓存过期时间常量================
const ZERO = 0; //0ms
const SHORTEST_INVALIDATE = 900000; //15 minutes
const SHORTER_INVALIDATE = 1800000; //2*SHORTEST_INVALIDATE; //half an hour
const SHORT_INVALIDATE = 3600000; //2*SHORTER_INVALIDATE; //one hour
const LONG_INVALIDATE = 10800000; //3*SHORT_INVALIDATE; //three hours
const LONGER_INVALIDATE = 21600000; //2*LONG_INVALIDATE; //six hours
const LONGEST_INVALIDATE = 86400000; //4*LONGER_INVALIDATE; //one day
const TOO_LONG_INVALIDATE = 172800000; //2*LONGEST_INVALIDATE; //two days
const FOREVER = -2; //forever
const TEST_INVALIDATE = 10000; //ten seconds,only for debug and test
//=====================================================
const SALT = '|*&@_@&*|';
const SAVE_KEY = 'storageKeys';

//当前缓存大小
let currentSize = 0;
//缓存上限 10240kb,10M
let limitSize = 10240;
//主键集合
let storageKeys = [];

let limitChecking = false;
//缓存对象集合
let storageList = {};
// 空函数
let noop = function(){};
// debug模式
let _debug = false;
//=====================================================
/**
 * 缓存对象基类
 * 每一个缓存对象管理了一群以masterKey为后缀的缓存数据
 * 
 */
class StorageInfo {
    /**
     * 构造函数
     * @param {Number} invalidateTime 缓存时间，单位ms，默认为0
     * @param {String} masterKey 存储主键 
     * @param {Boolean} isSync 方法是否为同步 
     */
    constructor(invalidateTime = 0, masterKey = '', isSync = false) {
        this.invalidateTime = invalidateTime;
        this.isSync = isSync;
        this.masterKey = masterKey;
        //注册缓存实例
        addStorageInstance(this.masterKey, this);
    }

    set invalidateTime(value) {
        this._invalidateTime = value || 0;
        this.forever = value === FOREVER;
    }

    get invalidateTime() {
        return this._invalidateTime;
    }
    /**
     * @public
     * 按照参数保存数据到缓存
     * @param {Array} params [necessary] 参数集合 
     * @param {*} data [necessary] 保存的值
     * @param {Function} cb [optional] 回调函数，`function(error,result){}`
     */
    save(params,data,cb){}
    /**
     * @public
     * 按照参数读取缓存
     * @param {Array} params [necessary] 参数集合 
     * @param {Function} cb [optional] 回调函数，`function(error,result){}`
     */
    read(params,cb){}
    /**
     * @public
     * 清除管理数据
     * @param {String} key [necessary] 存储键名，
     * 是指合成后的键名，而不是masterKey
     */
    clear(key) {
        if(!key) {
            return;
        }
        removeItemSync(key);
    }
    /**
     * @public
     * 检查某一条缓存是否过期，过期的将会被删掉
     * @param {*} storageKey [necessary] 存储键名，
     * 是指合成后的键名，而不是masterKey
     */
    check(storageKey) {
        if (!storageKey) {
            return;
        }
        execValidateCheck(storageKey);        
    }
    /**
     * @public
     * 摧毁缓存对象，以备回收
     */
    destory() {
        removeStorageInstance(this.masterKey);
        this.invalidateTime = null;
        this.masterKey = null;
        this.forever = null;
        this.isSync = null;
    }
}
//=====================================================
/**
 * @public
 * 创建一个专属缓存对象
 * @param {String} masterKey [necessary] 存储的主键名
 * @param {Number} invalidateTime [optional] 缓存失效时间，默认为`0ms`
 * @param {Boolean} isSync [optional] 是否使用同步方式存取，默认`false`，使用异步方式存取
 * 
 * @return {StorageInfo} 专属缓存对象，可复用，用来多次进行存取数据。
 */
function createStorage(masterKey, invalidateTime = 0, isSync = false) {
    if(!masterKey) {
        if(_debug) {
            console.error('In StorageManager createStorage(),the param of masterKey is error--->',masterKey);
        }
        return;
    }

    return createStorageMethod(isSync)(new StorageInfo(invalidateTime, masterKey, isSync));
}
/**
 * @public
 * 获取/创建一个专属缓存对象
 * 已经创建过就返回，没有则创建
 * @param {String} masterKey [necessary] 存储的主键名
 * @param {Number} invalidateTime [optional] 缓存失效时间，默认为`0ms`
 * @param {Boolean} isSync [optional] 是否使用同步方式存取，默认`false`，使用异步方式存取
 * 
 * @return {StorageInfo} 专属缓存对象，可复用，用来多次进行存取数据。
 */
function gainStorage(masterKey, invalidateTime = 0, isSync = false) {
    if (!masterKey) {
        if (_debug) {
            console.error('In StorageManager createStorage(),the param of masterKey is error--->', masterKey);
        }
        return;
    }
    let storageInfo = getStorageInstance(masterKey);
    if (!storageInfo) {
        storageInfo = createStorage(masterKey, invalidateTime, isSync);
    }

    let ary = Array.from(arguments);
    if (ary.length === 1) {
        return storageInfo;
    }

    //如果同步与异步设置发生变化，重新对缓存对象的方法进行创建
    if (isSync !== storageInfo.isSync) {
        storageInfo = createStorageMethod(isSync)(storageInfo);
    }

    if(invalidateTime !== 0) {
        storageInfo.invalidateTime = invalidateTime;
    }
    return storageInfo;
}
//==============================================================================

/**
 * @private
 * 创建缓存对象的缓存方法
 * @param {*} isSync 
 */
function createStorageMethod(isSync = false) {
    let saveFn = createSave(isSync);
    let readFn = createRead(isSync);

    return function(storageInfo) {
        if (!storageInfo) {
            return;
        }
        storageInfo.save = saveFn;
        storageInfo.read = readFn;

        saveFn = null;
        readFn = null;

        return storageInfo;
    }
}
/**
 * @private
 * 创建存储函数
 * @param {Boolean} isSync [necessary] 是否使用同步方式存取，默认`false`，使用异步方式存取
 * @return {(params:any[],data:any,cb:(error:any,result:any)=>void)=>void} 存储函数
 */
function createSave(isSync) {
    let doSave = isSync ? saveItemSync : saveItem;

    return function(params, data, cb) {
        
        let canUse = prepareSave.apply(this, [params, data, cb]);
        if (canUse === false) {
            return;
        }
        //key,value,callbackFn
        doSave(canUse[0], canUse[1], cb);
    };
}
/**
 * @private
 * 创建读取函数
 * @param {Boolean} isSync [necessary] 是否使用同步方式存取，默认`false`，使用异步方式存取
 * @return {(params:any[],cb:(error:any,result:any)=>void)=>void} 读取函数
 */
function createRead(isSync) {
    let doRead = isSync ? readItemSync : readItem;
    return function(params, cb) {
        if (!checkSaveParams(params, cb)) {
            return false;
        }
        //合成键名和值
        let list = combineKeyValue(this.masterKey, 0, params);
        let [key] = list;

        doRead(key, (err, res) => {
            if (err) {
                return cb(err);
            }
            afterRead.call(this, key, res, cb);
        });
    }
}
/**
 * @private
 * 准备创建数据缓存的条件
 * @param {Array} params [necessary] 参数集合
 * @param {Function} cb [necessary] 回调函数，`function(error,result){}`
 * @return {Boolean} true 准备就绪，false 出现错误
 */
function prepareSave(params, data, cb, masterKey, invalidateTime){
    if(!checkSaveParams(params, cb)){
        return false;
    }
    //合成键名和值
    let list = combineKeyValue(this.masterKey || masterKey,this.invalidateTime || invalidateTime,params,data);
    if(!list){
        cb({
            message:'In LS combineKeyValue(),happen an error,please open debug mode and check the error.',
            detail:'',
        },null);
        return false;
    }

    //容量检测
    let [isFull, fullError] = isStorageFull();
    if (isFull) {
        cb(fullError, null);
        return false;
    }
    return list;
}
/**
 * @private
 * 读取一条缓存之后的处理
 * @param {*} res [necessary] 返回值
 * @param {(error,result)=>void} cb [necessary] 回调函数，`function(error,result){}`
 */
function afterRead(key, res, cb){
    let value = res;
    if(!value){
        cb({
            message:'Value is undefined',
            detail:res,
        },null);
        return;
    }

    let valueAry = value.split(SALT);
    let saveTime = parseInt(valueAry[0]);
    let invalidate = valueAry[1] === FOREVER ? FOREVER : parseInt(valueAry[1]);
    let result = valueAry[2];
    
    //以实际存储的过期时效为准
    if (this && this.invalidateTime !== invalidate) {
        this.invalidateTime = invalidate;
    }

    //检测过期时间    
    if (invalidate !== FOREVER) {
        let now = new Date().getTime();
        if (now - saveTime > invalidate) {
            cb({
                message:'Value has invalidated',
                detail:`now:${now},save time:${saveTime},invalidateTime:${invalidate}`,
            });
            this.clear(key);
            return;
        }
    }
    
    //解析数据    
    try{
        result = JSON.parse(result);
    } catch(error) {
        cb({
            message:'Parse json error',
            detail:error,
        },null);
        return;
    }

    cb(null, result, invalidate);
}
/**
 * @private
 * 检查传入存储函数的参数
 * @param {Array} params [necessary] 参数集合
 * @param {Function} cb [optional] 回调函数，`function(error,result){}`
 * @return {Boolean} `true` 检测可用，`false` 检测不可用
 */
function checkSaveParams(params, cb) {
    if (!params || ! Array.isArray(params)) {
        if (_debug) {
            console.error(`In save(),the params are error====>params:${Array.isArray(params)}`);
        }
        return false;
    }
    if (typeof cb !== 'function') {
        if (_debug) {
            console.warn(`In save(),the callback is not right.====>cb:${typeof cb}`);
        }
        cb = noop;
    }
    return true;
}
/**
 * @private
 * 合成存储键名和键值
 * @param {String} masterKey [necessary] 存储类的主键名
 * @param {Number | String} invalidateTime [necessary] 存储数据的持续时间段
 * @param {Array} params [necessary] 参数集合
 * @param {*} data [optional] 存储的值 
 * @return {undefined | [key,value]} 如果正确返回数组，
 * 则0为可用于存储的键名，1为已打上时间戳用于存储数据的字符串
 */
function combineKeyValue(masterKey, invalidateTime, params, data) {
    //合并产生键名
    let key = combineSaveKey(masterKey, params);
    let value;
    //合并产生数据值
    if (data && typeof data === 'object') {
        try{
            data = JSON.stringify(data);
        } catch(error) {
            if (_debug) {
                console.error('In LS combineKeyValue(),save value stringify json happen error.',error);
            }
            return;
        }
        value = (new Date()).getTime() + SALT + invalidateTime + SALT + data;
    }    

    return [key, value];
}
/**
 * @private
 * 缓存容量是否已满
 * @return {Boolean} true已满，false未满
 */
function isStorageFull() {
    //容量检测
    if (limitSize - currentSize <= 2) {
        return [true, {
            message:'The storage is full.',
            detail:`limitSize:${limitSize},currentSize:${currentSize}`,
        }];
    }
    return [false];
}

/**
 * @private
 * 执行缓存有效期检查
 * @param {String} storageKey [necessary] 存储键名 
 */
function execValidateCheck(storageKey) {
    readItemSync(storageKey, function(error,res) {
        if (error) {
            if (_debug) {
                console.error('In LS execValidateCheck(),read data failed.',error);
            }
            return;
        }
        let valueAry = res.split(SALT);
    
        //检测过期时间
        let time = +valueAry[0];
        let invalidateTime = +valueAry[1];
        
        if (invalidateTime !== FOREVER) {
            let now = new Date().getTime();
            if (now - time > invalidateTime) {
                removeItemSync(storageKey);
            }
        }
    });
}

function prepareValidateCheck() {
    let len = storageKeys.length;
    while(len--) {
        let key = storageKeys[len];
        if (!key || key.indexOf(SALT) < 0) {
            continue;
        }
        let list = storageKeys[len].split(':');
        let masterKey = list[list.length-2];
        let storage;

        //已存在的storage直接进行检查，不存在的解析缓存结果进行检查
        if ((storage = storageList[masterKey]) && storage instanceof StorageInfo) {
            storage.check(storageKeys[len]);
        } else {
            execValidateCheck(storageKeys[len]);
        }
    }
}

//================================================================
/**
 * @public
 * 合成用于存储的键名
 * 键名不仅可用于存储，读取，还可以用于主动删除缓存
 * @param {*} masterKey 
 * @param {*} params 
 */
function combineSaveKey(masterKey = '', params = []) {
    return params.concat([masterKey], [SALT]).join(':');
}
/**
 * @public
 * 检查并删除所有过期数据
 */
function checkInvalidate() {
    getLimit(prepareValidateCheck);
}

/**
 * @public
 * 删除某一个masterKey下的所有缓存数据
 * 不论是否过期
 * @param {String} masterKey [necessary] 主键名 
 */
function deleteDataByMasterKey(masterKey) {
    if (!masterKey) {
        return;
    }
    storageKeys.forEach(function(item,index) {
        let list = item.split(':');
        let mk = list[list.length-2];
        if (masterKey === mk) {
            removeItemSync(mk);
        }
    });
    getLimit();
}
/**
 * @public
 * 便捷存储方式
 * @param {String} masterKey [necessary] 主键名
 * @param {Number | String} invalidateTime [necessary] 存储数据的持续时间段
 * @param {Array} params [necessary] 参数集合
 * @param {*} data [optional] 存储的值 
 * @param {Function} cb [optional] 回调函数，`function(error,result){}`
 */
function quickSave(masterKey, invalidateTime=0, params, data, cb){
    if (!masterKey) {
        if (_debug) {
            console.error('In StorageManager createStorage(),the param of masterKey is error--->', masterKey);
        }
        return;
    }
    let canUse = prepareSave.apply(this, [params,cb], masterKey, invalidateTime);
    if (canUse === false) {
        return;
    }
    //key,value,callbackFn
    saveItemSync(canUse[0], canUse[1], cb);
}
/**
 * @public
 * 便捷读取方式
 * @param {String} masterKey [necessary] 主键名
 * @param {Array} params [necessary] 参数集合
 * @param {Function} cb [optional] 回调函数，`function(error,result){}`
 */
function quickRead(masterKey, params, cb) {
    if (!masterKey) {
        if (_debug) {
            console.error('In StorageManager createStorage(),the param of masterKey is error--->', masterKey);
        }
        return;
    }
    if (!checkSaveParams(params,cb)) {
        return false;
    }
    //合成键名和值
    let list = combineKeyValue(masterKey, 0, params);
    let [key] = list;
    
    readItemSync(key, (err, res) => {
        if (err) {
            return cb(err);
        }
        afterRead.call(this, key, res, cb);
    });
}

//================================================================
/**
 * @private
 * 添加一个缓存对象
 * @param {String} masterKey [necessary] 主键名 
 * @param {StroageInfo} storageInfo [necessary] 缓存对象
 */
function addStorageInstance(masterKey, storageInfo){
    if (!masterKey || !storageInfo instanceof StorageInfo || typeof storageInfo.check !== 'function') {
        return;
    }
    storageList[masterKey] = storageInfo;
}

/**
 * @private
 * 删除某一个materKey对应的存储对象
 * @param {String} masterKey [necessary] 主键名 
 */
function removeStorageInstance(masterKey) {
    if (!masterKey || !storageList[masterKey]) {
        return;
    }
    storageList[masterKey] = null;
}

/**
 * @private
 * 获取一个已经创建过的缓存对象实例
 * @param {String} masterKey [necessary] 主键名 
 */
function getStorageInstance(masterKey) {
    if (!masterKey || !storageList[masterKey]) {
        return;
    }
    return storageList[masterKey];
}
//================================================================

/**
 * @private
 * 执行存储数据，异步
 * @param {String} key [necessary] 存储键
 * @param {*} value [necessary] 存储数据 
 * @param {Function} cb [optional] 回调函数，`function(error,result){}`
 */
function saveItem(key,value,cb) {
    wx.setStorage({
        key:key,
        data:value,
        success() {
            if(typeof cb === 'function'){
                cb(null,true);
            }            
            getLimit();
        },
        fail(error) {
            if(typeof cb === 'function'){
                cb(error,null);
            }
        },
    });
}
/**
 * @private
 * 同步存储数据
 * @param {String} key [necessary] 存储键
 * @param {*} value [necessary] 存储数据 
 * @param {Function} cb [optional] 回调函数，`function(error,result){}`
 */
function saveItemSync(key, value, cb) {
    try {
        wx.setStorageSync(key, value);
    } catch(error) {
        if (_debug) {
            console.error('In LS saveItemSync(),save storage sync failed====>',key);
        }

        if (typeof cb === 'function') {
            cb({
                message:'save data sync failed.',
                detail:error,
            });
        }        
        return false;
    }    
    if (typeof cb === 'function') {
        cb(null, true);
    }
    return true;
}

/**
 * @private
 * 执行读取数据,异步
 * @param {String} key [necessary] 存储键
 * @param {(res)=>void} successFn [necessary] 成功回调函数
 * @param {(error)=>void} errorFn [necessary] 失败回调函数
 */
function readItem(key, cb) {
    wx.getStorage({
        key:key,
        success(res) {
            cb(null, res.data);
        },
        fail(error) {
            cb({
                message:`Read ${key} error`,
                detail:error,
            });
        },
    });
}

/**
 * @private
 * 同步读取一条缓存
 * @param {String} key [necessary] 存储键
 * @param {(error, response) => void} cb [necessary] 回调函数
 */
function readItemSync(key, cb) {
    let value;
    try{
        value = wx.getStorageSync(key);
    } catch(error) {
        if (_debug) {
            console.error('In LS readItemSync(),read storage sync failed====>',key);
        }
        cb({
            message:`Read ${key} error`,
            detail:error,
        });
        return false;
    }
    cb(null, value);
    return true;
}

/**
 * @private
 * 执行删除数据，同步
 * @param {String} key [necessary] 存储键
 */
function removeItemSync(key) {
    try{
        wx.removeStorageSync(key);
    } catch(error) {
        if (_debug) {
            console.error('In LS removeItem(),catch an error===>',error);
        }        
    }
}

/**
 * @private
 * 保留必要数据，清除所有非必要数据
 */
function clearAllUnnecessary(){
     
}
//=============================================================
/**
 * @public
 * 删除所有缓存
 */
function clearAll(isSync=false) {
    if (isSync) {
        try {
            wx.clearStorageSync()
        } catch(error) {
          if(_debug){
              console.error('In LS clearAll(),call wx clearStorageSync failed.--->',error);
          }
        }
    }else{
        wx.clearStorage();
    }
    
}

//============================================================
/**
 * @private
 * 获取系统缓存详情
 */
function getLimit(cb) {
    if (limitChecking) {
        return;
    }
    limitChecking = true;
    wx.getStorageInfo({
        success(res) {
            limitChecking = false;
            storageKeys = res.keys || [];
            currentSize = res.currentSize;
            limitSize = res.limitSize;
            saveItemSync(SAVE_KEY, storageKeys, (error) => {
                if(error && _debug) {
                    console.error('In LS getLimit(), save storageKeys sync failed.', error);
                }
            });
            if (typeof cb === 'function') {
                cb();
            }
        },
        fail(error) {
            limitChecking = false;
            if (_debug) {
                console.error('In LS getLimit(),get system storage info failed',error);
            }            
        },
    });
}
// getLimit();

//================================================================
export default {
    /**0ms */
    ZERO,
    /**15 minutes*/
    SHORTEST_INVALIDATE,
    /**half an hour*/
    SHORTER_INVALIDATE,
    /**one hour*/
    SHORT_INVALIDATE,
    /**three hours*/
    LONG_INVALIDATE,
    /**six hours*/
    LONGER_INVALIDATE,
    /**one day*/
    LONGEST_INVALIDATE,
    /**two days*/
    TOO_LONG_INVALIDATE,
    /**forever*/
    FOREVER,
    /**
     * ten seconds,
     * only for debug and test.
     * */
    TEST_INVALIDATE,
    //====================================
    set debug(value){
        _debug = value;
    },
    get debug(){
        return _debug;
    },
    setup(){
        // readItemSync(SAVE_KEY, (data) => {
        //     storageList = data || {};
        // }, (error) => {
        //     if(_debug) {
        //         console.error('In StorageManager setup(), read storageList sync failed.', error);
        //     }
        //     storageList = {};
        // });

        //最初执行一次
        getLimit();
    },
    destroy(){
        currentSize = null;
        limitSize = null;
        storageKeys = null;
        limitChecking = null;
        storageList = null;     //下一步增加每个缓存对象再此时也销毁的方法
        noop = null;
        _debug = null;
    },
    //========================================
    /**
     * @public
     * 获取 / 创建一个专属缓存对象
     * @param {String} masterKey [necessary] 存储的主键名
     * @param {Number} invalidateTime [optional] 缓存失效时间，默认为`0ms`
     * @param {Boolean} isSync [optional] 是否使用同步方式存取，默认`false`，使用异步方式存取
     * 
     * @return {StorageInfo} 专属缓存对象，可复用，用来多次进行存取数据。
     */
    gainStorage,
    /**
     * @public
     * 创建一个专属缓存对象
     * @param {String} masterKey [necessary] 存储的主键名
     * @param {Number} invalidateTime [optional] 缓存失效时间，默认为`0ms`
     * @param {Boolean} isSync [optional] 是否使用同步方式存取，默认`false`，使用异步方式存取
     * 
     * @return {StorageInfo} 专属缓存对象，可复用，用来多次进行存取数据。
     */
    createStorage,
    /**
     * @public
     * 检查并删除所有过期数据
     */
    checkInvalidate,
    /**
     * @public
     * 删除某一个masterKey下的所有缓存数据
     * 不论是否过期
     * @param {String} masterKey [necessary] 主键名 
     */
    deleteDataByMasterKey,
    /**
     * 删除所有缓存
     */
    clearAll,
    /**
     * 便捷存储方式
     * @param {String} masterKey [necessary] 主键名
     * @param {Number | String} invalidateTime [necessary] 存储数据的持续时间段
     * @param {Array} params [necessary] 参数集合
     * @param {*} data [optional] 存储的值 
     * @param {Function} cb [optional] 回调函数，`function(error,result){}`
     */
    quickSave,
    /**
     * 便捷读取方式
     * @param {String} masterKey [necessary] 主键名
     * @param {Array} params [necessary] 参数集合
     * @param {Function} cb [optional] 回调函数，`function(error,result){}`
     */
    quickRead,
    /**
     * @public
     * 合成用于存储的键名
     * 键名不仅可用于存储，读取，还可以用于主动删除缓存
     * @param { String } masterKey [necessary] 主键名
     * @param { Array } params [necessary] 参数集合
     */
    combineSaveKey,
};