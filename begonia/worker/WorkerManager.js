/**
 * 小程序线程管理模块
 * @author Brave Chan on 2018.3.29
 */
//============================================

let _working = false;
let _debug = false;
let _cKey = '';
let _cWorker;
let waitList = [];
let _workers = {};
let _workerKeys = {};
//=============private========================
/**
 * 执行发送消息
 * @param {*} data 
 * @param {*} cb 
 */
function doMessage(data,cb=noop){
    if(!_cWorker){
        if(_debug){
            console.error('In WorkerManager doMessage(),can not use current worker!',_cWorker,_cKey,_workers);
        }
        return cb({
            message:'CAN_NOT_USE_CURRENT_WORKER',
            detail:'In WorkerManager doMessage(),can not use current worker!',
        });
    }

    _cWorker.onMessage(function(res){
        terminateAndNext();
        _working = false;

        cb(null,res);        
    });
    
    _cWorker.postMessage(data);
}
/**
 * 创建worker
 * @param {*} workerKey 
 * @param {*} path 
 */
function createWorker(workerKey,path){
    _cKey = workerKey;
    _cWorker = wx.createWorker(path);
    if(!_cWorker){
        if(_debug){
            console.error("In WorkerManager message(),can not create worker by this workerKey:",workerKey,path);
        }        
    }
    return _cWorker;
}
/**
 * 终结当前worker并继续下一个worker
 */
function terminateAndNext(){
    clearWorkers();

    if(waitList.length<=0){
        return;
    }

    let opt = waitList.shift();
    message(opt.workerKey,opt.data,opt.cb);
}

function noop(){}
//=============public=========================

/**
 * @public
 * 注册一个worker
 * @param {*} opt
 * opt{
 *  [workerKey]:workerPath,
 * } 
 */
function rejester(opt={}){
    Object.assign(_workers,opt);
    let keys = Object.keys(opt);
    for(let value of keys){
        _workerKeys[value] = value;
    }
}

/**
 * @public
 * 向worker发送消息
 * @param {*} workerKey [necessary] 要使用的worker的键名 
 * @param {*} data [optional] 发送的消息数据对象
 */
function message(workerKey,data={},cb=noop){
    if(!workerKey){
        if(_debug){
            console.error('In WorkerManager message(),PARAMS_ERROR',`workerKey:${workerKey}`,`data:${data}`);
        }
        return cb({
            message:'PARAMS_ERROR',
            detail:'In WorkerManager message(),PARAMS_ERROR.'
        });
    }
    
    let path = _workers[workerKey];
    
    if(!path){
        if(_debug){
            console.error("In WorkerManager message(),can not find script in path list:",workerKey,_workers);            
        }
        return cb({
            message:"CAN_NOT_FIND_WORKER",
            detail:`In WorkerManager message(),CAN_NOT_FIND_WORKER.`
        });
    }
    //如果正在工作中，那么将新的缓存起来
    if(_working){
        let obj = {
            workerKey,
            data,
            cb,
        };
        waitList[waitList.length] = obj;
        if(_debug){
            console.log('In WorkerManager message(),some one add in waiting===>',obj);
        }        
        return;
    }
    _working = true;
    let worker = createWorker(workerKey,path);

    if(!worker){
        _working = false;
       
        return cb({
            message:'CREATE_WORKER_ERROR',
            detail:`In WorkerManager message,can not create worker.`,
        });
    }

    if(_debug){
        console.log('In WorkerManager message(),will setup worker and send message ===>',workerKey,data);
    } 
    
    //执行发送消息
    doMessage(data,cb);
}

/**
 * @public
 * 清空所有的
 */
function clearWorkers(){

    if(_cWorker){
        _cWorker.terminate();
        _cWorker = null;
        _cKey = '';
    }
}

/**
 * @public
 * 应用配置文件
 * @param {*} config 
 */
function config(config){
    let list = config.workers;
    if(!list){
        return;
    }
    Object.assign(_workers,list);
    let keys = Object.keys(list);
    for(let value of keys){
        _workerKeys[value] = value;
    }
}
//============================================
export default {
    get debug(){
        return _debug;
    },
    set debug(value){
        _debug = !!value;
    },
    setup(configObj){
        config(configObj);
    },
    destroy(){
        clearWorkers();
        waitList = [];
        _workerKeys = {};
        _workers = {};
        _working = null;
    },
    //=============================
    get currentWorkerKey(){
        return _cKey;
    },
    get working(){
        return _working;
    },
    /**
     * @public
     * 获取注册的worker列表
     * 只有在开启了debug模式的情况才可用
     */
    get workers(){
        if(_debug){
            return _workers;
        }
        return {};
    },
    get workerKeys(){
        return _workerKeys;
    },
    /**
     * @public
     * 应用配置文件
     * @param {*} config 
     */
    config,
    /**
     * @public
     * 动态注册一个worker
     * @param {*} opt
     * opt{
     *  [workerKey]:workerPath,
     * } 
     */
    rejester,
    /**
     * @public
     * 启动指定worker
     * @param {*} name [necessary]
     * @param {Object} msg [optional]
     * 
     * @return {Promise} 
     * 
     * `resolve`worker返回值；
     * 
     * `reject`worker返回错误
     */
    // setupWorker,
    /**
     * @public
     * 向worker发送数据
     * @param {*} obj 
     * @return {Promise} 
     * 
     * `resolve`worker返回值；
     * 
     * `reject`worker返回错误
     */
    message,
    /**
     * @public
     * 清空所有的
     */
    clearWorkers,
};