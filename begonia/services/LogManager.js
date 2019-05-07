/**
 * 日志管理类
 * 
 * @author Brave Chan on 2017.8
 * 
 */
//===============================================
import util from '../util';
//==============================================
let _debug = false;
const NORMAL = 'l1';
const INFO = 'l2';
const ERROR = 'l3';
const WARN = 'l4';
const style = {
    l1:'log__txt--normal',
    l2:'log__txt--info',
    l3:'log__txt--error',
    l4:'log__txt--warn',
};
let _logList = [];
//===============================================
/**
 * 日志单项
 */
class LogItem{
    constructor(type,message,detail){
        this.className = style[type];
        this.message = message;
        this.detail = detail;
        this.time = util.formatTime(new Date().getTime(),false);
    }
}
//================================================
/**
 * @private
 * 
 * 变为数组
 * @param {*} list 
 */
function toArray(list){
    return Array.from(list);
}

/**
 * @private
 * 将对象处理成json字符串
 * @param {*} obj 
 */
function handleObj(obj){
    try{
        return JSON.stringify(obj);
    }catch(error){
        return JSON.stringify({
            message:'stringify json error,please check.',
        });
    }
}

/**
 *  @private
 * 
 * 将日志信息整理合并为单条字符串
 * @param {*} list 
 */
function tidyMessage(list){
    for(let i=0,len=list.length;i<len;i++){
        let item = list[i];
        if(item && typeof item === 'object'){
            list[i] = handleObj(item);
        }
    }
    let cnt = list.join('<==>');
    return cnt;
}
//================================================
/**
 *  @public
 * 
 * 输出普通日志
 */
function trace(){
    let list = toArray(arguments);
    let cnt = tidyMessage(list);
    _logList[_logList.length] = new LogItem(NORMAL,'消息',cnt);
    if(_debug){
        console.log.apply(console,arguments);
    }
}
/**
 *  @public
 * 
 * 输出信息日志
 */
function info(){
    let list = toArray(arguments);
    let cnt = tidyMessage(list);
    _logList[_logList.length] = new LogItem(INFO,'信息',cnt);
    if(_debug){
        console.info.apply(console,arguments);
    }
}
/**
 *  @public
 * 
 * 输出错误日志
 */
function error(){
    let list = toArray(arguments);
    let cnt = tidyMessage(list);
    _logList[_logList.length] = new LogItem(ERROR,'错误',cnt);
    if(_debug){
        console.error.apply(console,arguments);
    }
}
/**
 * @public
 * 
 * 输出警告日志
 */
function warn(){
    let list = toArray(arguments);
    let cnt = tidyMessage(list);
    _logList[_logList.length] = new LogItem(WARN,'警告',cnt);
    if(_debug){
        console.warn.apply(console,arguments);
    }
}
//==========================================
export default {
    trace,
    info,
    error,
    warn,
    /**
     * 获取日志信息列表
     */
    get logList(){
        return _logList;
    },
    /**
     * 开启/关闭 debug模式
     */
    set debug(value){
        _debug = !!value;
    },
    get debug(){
        return _debug;
    },
    /**
     * 启动log
     */
    setup(){},
    /**
     * 装饰函数
     * 可以为vmp对象提供快捷使用方法
     * @param {ViewModelProxy} vmp 
     */
    decorator(vmp){
        if(typeof vmp.trace === 'undefined'){
            vmp.trace = trace;
        }else{
            if(_debug){
                console.error("In LogManager,when do decorate vmp,there is same key of trace in vmp already,please check.");
            }            
            return;
        }

        if(typeof vmp.info === 'undefined'){
            vmp.info = info;
        }else{
            if(_debug){
                console.error("In LogManager,when do decorate vmp,there is same key of info in vmp already,please check.");
            }            
            return;
        }

        if(typeof vmp.error === 'undefined'){
            vmp.error = error;
        }else{
            if(_debug){
                console.error("In LogManager,when do decorate vmp,there is same key of error in vmp already,please check.");
            }            
            return;
        }

        if(typeof vmp.warn === 'undefined'){
            vmp.warn = warn;
        }else{
            if(_debug){
                console.error("In LogManager,when do decorate vmp,there is same key of warn in vmp already,please check.");
            }            
            return;
        }
    },
    /**
     * 清理vmp上的装饰函数
     * @param {ViewModelProxy} vmp 
     */
    clearVMP(vmp){
        if(!vmp){
            return;
        }
        vmp.trace = null;
        vmp.info = null;
        vmp.error = null;
        vmp.warn = null;
    },
    /**
     * @internal
     * 进行销毁LogManager的操作
     */
    destroy(){
        _logList = null;
    },
};
