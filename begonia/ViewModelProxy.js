/**
 * VM更新及VM代理
 * 
 * vm是附加在小程序页面和组件上的对象
 * 它可以通过延迟执行`setData()`进行优化
 * 
 * 同时提供一个代理对象包装ViewModleProxy(vmp)
 * 用于使用套件中提供其他增强功能
 * 
 * @version 0.2.0
 * @author Brave Chan on 2017.12 
 */
//===================================================
import util from './util';
//===================================================
let renderList = {};
let vmList = {};
const VMO_ID = 'vmo_id$';
let renderTimer = null;
let _interval = 100;
let _debug = false;
//===============================================
/**
 * @private
 * 
 * VM配置对象
 */
class VM{
  constructor(principal,id){
    this.principal = principal;
    this[VMO_ID] = id;
    this.optData = {};
    this.cache = {};
    this.rendering = false;
  }
  /**
   * @internal
   * 执行数据生效
   */
  validate(){
    if(!this.optData){
      return;
    }

    let noUse = !Object.keys(this.optData).length>0;

    if(noUse){
      return;
    }

    let canUse = this && !this.rendering && this.principal && typeof this.principal.setData === 'function';

    if(canUse){
      if(_debug){
        console.info("In VMP vm validate(),The vm ===>",this.principal,"will validate props===>",this.optData);
      }
      this.rendering = true;
      this.principal.setData(this.optData,()=>{
        this.rendering = false;
        //重置对象等待下一次
        this.optData = this.cache;
        this.cache = {};

        //如果有需要更新的，并且不再渲染列表，则加入
        let keys = Object.keys(this.optData);
        if(keys.length>0 && !renderList[this[VMO_ID]]){
          addRender(this[VMO_ID]);
        }
      });
    }else{
      if(_debug && this.rendering){
        console.log("In VMP vm validate(),the vm is rendering,please wait next loop.",this.cache);
        return;
      }
      if(_debug){
        console.error("In VMP vm validate(),the scope/principal/setData error");
      }
    }    

    //如果canUse === false，那么将累积设置，这点需要仔细考虑解决方法    
  }
  /**
   * @internal
   * 提交属性改动
   * @param {String} propName [necessary] 属性名
   * @param {*} value [necessary] 新的值
   */
  commit(propName,value){
    let canUse = this && this.optData && this.optData[propName] !== value;
    
    if(!canUse){
      return;
    }
   
    //如果正在执行渲染，则先加入缓存对象
    if(this.rendering){
      if(_debug){
        console.log("In VMP vm validate(),the vm is rendering,will commit into cache now.==>",propName);
      }
      this.cache[propName] = value;
    }else{
      this.optData[propName] = value;
    }

    if(_debug){
      console.info("In VMP vm commit(),commit prop==>",propName,value);
    }
    
    addRender(this[VMO_ID]);
  }
  /**
   * 销毁对象
   */
  destroy(){
    this.optData = null;
    this[VMO_ID] = null;
    this.principal = null;
  }
}
//================================================
class VMProxy{
  constructor(id){
    this[VMO_ID] = id;
  }
  /**
   * @internal
   * 
   * 获取代理的vm实例
   * 此方法有可能被废弃，
   * 并且在内部使用，
   * 请不要主动调用它。
   */
  get _vm(){
    return vmList[this[VMO_ID]];
  }
  /**
   * @public
   * 提交属性修改
   * @param {String} prop [necessary] 属性名 
   * @param {*} value [necessary] 属性值 
   */
  commit(prop,value){
    if(typeof prop === 'string'){
      commitProperty(this[VMO_ID],prop,value);
    }
    if(util.isObject(prop)){
      commitProperties(this[VMO_ID],prop);
    }
    return this;
  }
  /**
   * @public
   * 让设置立即生效
   * 即，立即调用`this.setData()`，让设置生效
   * 次方法应用在需要立即让配置生效的场景，
   * 这会造成将当前缓存的属性修改配置立即提交wx处理。
   * 因此从性能考虑，此方法最好只用在确实必要之时。
   */
  validateNow(){
    validateNow(this[VMO_ID]);
    return this;
  }
  /**
   * @public
   * 销毁vmp和vm
   */
  destroy(){  
    destroyVM(this[VMO_ID]);  
  }
}
//===============================================
/**
 * @private
 * 数据立即生效
 * @param {String} id [necessary] vm的id 
 */
function validateNow(id){
  let vm = vmList[id];
  if(!vm){
    return;
  }
  let vmId = vm[VMO_ID];
  if(renderList[vmId]){
    renderList[vmId] = void 0;
  }
  vm.validate();
}
/**
 * @private
 * 提交数据变动
 * @param {String} id [necessary] vm的id 
 * @param {String} propName [necessary] 属性名
 * @param {*} value [necessary] 新的属性值
 */
function commitProperty(id,propName,value){
  let vm = vmList[id];
  return vm?vm.commit(propName,value):null;
}
/**
 * @private
 * 批量提交数据变动
 * @param {String} id [necessary] vm的id
 * @param {Object} opt [necessary] 修改属性的集合
 */
function commitProperties(id,opt){
  let vm = vmList[id];
  let keys = Object.keys(opt);
  for(let value of keys){
    vm.commit(value,opt[value]);
  }  
}
/**
 * @private
 * 销毁一个VM实例
 * @param {String} id [necessary] vm的id
 */
function destroyVM(id){
  let vm = vmList[id];
  vmList[id] = void 0;
  return vm?vm.destroy():null;
}

//only for debug
function _outputVMS(){
  return vmList;
}

//======================================================
/**
 * @private
 * 添加一个vm到待执行列表
 * @param {*} id 
 */
function addRender(id){

  if(renderList[id]){
    return;
  }

  renderList[id] = true;
  if(!renderTimer){
    setupRender();
  }
}
/**
 * @private
 * 启动生效工作
 */
function setupRender(){
  renderTimer = setTimeout(validateProperties,_interval);
}
/**
 * @private
 * 数据生效
 */
function validateProperties(){
  clearTimeout(renderTimer);
  renderTimer = null;

  let vm,keys = Object.keys(renderList);
  
  for(let value of keys){
    vm = vmList[value];
    if(vm && renderList[value]){
      renderList[value] = void 0;
      vm.validate();
    }
  }
  // renderList = {}; //bug 有时计时器延迟，引起不必要的删除，暂时注释，改为赋值undefined
}
//===================================================
/**
 * @public
 * 创建vm对象和vmp代理对象
 * @param {*} principal 
 */
function create(principal){
  let id = util.getSysId();
  let vm = new VM(principal,id);
  vmList[vm[VMO_ID]] = vm;
  let vmp = new VMProxy(id);
  return vmp;  
}

//============================================
export default {
  /**
   * @public 
   * 
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
   * 设置更新的时间间隔
   */
  set interval(value){
    if(!Number.isInteger(value)){
      if(_debug){
        console.error("In VMP set interval(),the value is not integer number.====>",value);
      }
      return;
    }
    if(value === 0){
      if(_debug){
        console.warn("In VMP set interval(),if you need set interval to 0,you can use vmp.validateNow() method,which is much better.");
      }
      return;
    }
    _interval = value;
  },
  get interval(){
    return _interval; 
  },
  /**
   * @public
   * 
   * 创建vm对象和vmp代理对象
   * @param {Object} principal 
   */
  create,
  /**
   * @internal
   * 
   * id常量标识
   */
  VMO_ID,
};

