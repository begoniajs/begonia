/**
 * begoina的入口文件
 * 提供基本的方法
 * @version 0.4.0
 * 
 * @author Brave Chan on 2017.12
 * 
 */
//======================================================
import VMP from './ViewModelProxy';
import util from './util';
//=======================================================
const M_ID = 'be_m_id$';
let decorators = [];
let moduleList = [];
let _debug = false;
//=======================================================
use(VMP);
//=======================================================
/**
 * @public
 * 
 * 获取一个小程序页面或组件实例的代理
 * @param {Object} principal [necessary] 小程序页面或者组件的实例
 * 
 */
function getProxy(principal){
    if(!principal){
      return;
    }
    let vmp = VMP.create(principal);

    //wrapper plugin factory
    doDecorate(vmp,decorators);
    return vmp;
}
/**
 * @public
 * 
 * 增加程序运行中需要使用的增强模块
 * @param {Object} addModule [necessary] 增强模块 
 * @param {Object} config [optional] 模块设置
 * 如果设置了`config`参数并且模块也提供了`setup`方法，
 * 那么这个`config`对象将会作为`setup()`的参数传入模块中。
 * 模块利用其进行初始化配置。
 */
function use(addModule,config){
    let am = addModule;
    if(!am || !util.isObject(am)){
        return;
    }
    let id = util.getSysId();

    if(moduleList.indexOf(am)===-1){
        moduleList[moduleList.length] = am;
    }

    if(typeof am.decorator === 'function'){
        addDecorator(am.decorator,decorators);
    }

    if(typeof am.setup === 'function'){
        am.setup(config || {});
    }

    am.debug = _debug;
}

let index = 0;
/**
 * @public
 * 
 * 销毁vmp实例
 * 
 * 此方法为一个包装方法，
 * 会逐一按照装在的增强模块的顺序，
 * 调用模块开放的`clearVMP(vmp)`接口。
 * 最后调用vmp实例本身的`destroy()`方法。
 * vmp实例完成销毁，可以将变量或属性标记为`null`，
 * 以备gc回收
 * 
 */
function destroyVMP(){
    index++;
    if(index>100){
        return;
    }
    let len = moduleList.length;
    let am;
    while(len--){
        am = moduleList[len];
        if(am && typeof am.clearVMP === 'function'){
            am.clearVMP(this);
        }
    }
    this._destroy();
}

//=========================================
/**
 * @private
 * 
 * 是否在列表中存在
 * @param {Array} array [necessary] 列表
 * @param {*} obj [necessary] 对象
 */
function isExisting(array,obj){
    return array.indexOf(obj) !== -1;
}

/**
 * @private
 * 
 * 添加装饰器
 * @param {Function} fn [necessary] 装饰器函数
 * @param {Array} list [necessary] 装饰器列表 
 */
function addDecorator(fn,list){
    if(isExisting(list,fn)){
        return;
    }
    list[list.length] = fn;
}

/**
 * @private
 * 
 * 执行装饰操作
 * @param {VMP.VMProxy} vmp [necessary] vmp实例
 * @param {Array} list [necessary] 装饰器列表
 */
function doDecorate(vmp,list){
    if(list.length<=0 || !vmp){
        return;
    }
    let len = list.length;
    while(len--){
        list[len](vmp);       
    }
    //将vmp本身的destroy方法赋予别名
    //然后使用提供的包装函数包装
    //以备进行更完整的清理
    vmp._destroy = vmp.destroy;
    vmp.destroy = destroyVMP;
}
/**
 * @private
 * 设置模块的debug模式
 * @param {Boolean} debug [necessary] 当前的debug模式
 * @param {Array} list [necessary] 模块列表
 */
function setModulesDebug(debug,list){
    let len = list.length;
    while(len--){
        list[len].debug = debug;
    }
}

//=========================================
export default {
    /**
     * 设置debug模式
     * 
     * 开启debug模式，也会打开附加模块的debug模式
     */
    set debug(value){
        _debug = value;
        setModulesDebug(_debug,moduleList);
    },
    get debug(){
        return _debug;
    },
    /**
     * @public
     * 获得一个小程序页面或组件实例的代理
     * @param {Object} principal [necessary] 小程序页面或者组件的实例
     * @return {Object}
     */
    getProxy,
    /**
     * @public
     * 
     * 增加程序运行中需要使用的增强模块
     * @param {*} addModule [necessary] 增强模块 
     */
    use,
};