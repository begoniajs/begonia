/**
 * 执行链对象
 * @version 0.2.0
 * @author Brave Chan on 2018.1.7
 */
//============================================
import util from '../util';
//============================================
const noop = function(){};

let chainList = {};
//============================================
/**
 * 链对象
 */
class Chain{
  /**
   * 构造函数
   * @param {Array} list [required] 需要进行链式执行的函数队列
   * @param {Function} complete [optional] 执行完毕所有函数后的回调
   * 遵从`function(error[,data])`
   * - error 如果队列执行中发生错误，将作为第一个参数被返回
   * - data 如果最后一次调用`next()`传入了参数，参数将会作为回调函数的参数被返回
   * @param {*} scope 希望队列中的函数和回调函数中的this指向
   * @return {Chain}
   */
  constructor(list,complete,scope){
    this.id = util.getSysId();
    //加入链对象列表，生成一个结果状态对象
    addChain(this.id);
    this.execList = list;
    this._index = 0;
    this._doneFn = typeof complete === 'function'?complete:noop;
    this._scope = scope;

    //代理对象，作为传入队列中每个函数的参数之一
    this._proxy = {
      next:this.next.bind(this),
      error:this.error.bind(this),
      end:this.end.bind(this),
    };
  }
  /**
   * 此chain实例的完成状态
   */
  get done(){
    return chainList[this.id].done;
  }
  /**
   * 此chain实例此时的值
   * 如果队列中的函数有返回值，那么将会作为
   * 此chain此时的值。
   */
  get value(){
    return chainList[this.id].value;
  }
  /**
   * 执行下一项
   * 当第一次执行时，是启动队列执行。
   * @param {*} args
   * @return {Chain}
   */
  next(...args){

    if(this._index === void 0 || !this.execList){
      return this;
    }
    //处理已达到队列末尾时，执行回调函数
    if(this._index >= this.execList.length){
      if(this.value){
        setValue(this.id,void 0);
      }
      //如果已达到队列末尾，设置完成状态
      setDone(this.id,true);

      if(typeof this._doneFn === 'function'){
        this._doneFn.apply(this._scope,[null].concat(args));
        this._doneFn = null;
      }
      return this;

    }

    let fn = this.execList[this._index];
    if(typeof fn === 'function'){
      this._index++;

      let value = fn.apply(this._scope,[this._proxy].concat(args));

      setValue(this.id,value);

    }else{
      this.error({
        message:`The element of ${this._index} in execList who is not function type,please check====>
          ${typeof this.execList[this._index]}`,
      });
    }
    return this;
  }
  /**
   * 出现错误
   * @param {*} error
   *
   * @return {Chain}
   */
  error(error){
    if(typeof this._doneFn === 'function'){
      this._doneFn.call(this._scope,error);
    }
    return this;
  }
  /**
   * 结束队列的执行，直接打到完成状态
   * @param {*} args
   */
  end(...args){
    this._index = this.execList.length;
    setDone(this.id,true);
    this.next(...args);
  }
  /**
   * 重置
   * 重置之后的chain可以再被使用
   * @param {Array} list [required] 需要进行链式执行的函数队列
   * @param {Function} complete [optional] 执行完毕所有函数后的回调
   * 遵从`function(error[,data])`
   * - error 如果队列执行中发生错误，将作为第一个参数被返回
   * - data 如果最后一次调用`next()`传入了参数，参数将会作为回调函数的参数被返回
   * @param {*} scope 希望队列中的函数和回调函数中的this指向
   */
  reset(list=[],complete,scope){
    this._index = 0;
    this.execList = list;
    this._doneFn = typeof complete === 'function'?complete:noop;
    this._scope = scope;
    this._backValue = null;
    addChain(this.id);

    return this;
  }
  /**
   * 销毁
   * 执行销毁后的chain可被赋值为null
   * 处于不可再用状态
   */
  destroy(){
    removeChain(this.id);
    this._index = 0;
    this._backValue = null;
    this.execList = null;
    this.id = null;
    this._doneFn = null;
    this._scope = null;
  }
}
//==================private======================================
/**
 * 生成或重置一个chain实例对应的结果状态
 * @param {String} id [required] chain的id
 */
function addChain(id){
  if(!id){
    return;
  }
  chainList[id] = {
    done:false,
    value:void 0,
  };
}
/**
 * 移除一个chain实例对应的结果状态
 * @param {String} id [required] chain的id
 */
function removeChain(id){
  let result = chainList[id];
  if(!result){
    return;
  }
  chainList[id] = null;
}
/**
 * 设置完成状态
 * @param {String} id [required] chain的id
 * @param {Boolean} done [required] 完成状态
 */
function setDone(id,done){
  let result = chainList[id];
  if(!result){
    return;
  }
  result.done = done;
}
/**
 * 设置结果值
 * @param {*} id [required] chain的id
 * @param {*} value [required] 当前结果值
 */
function setValue(id,value){
  let result = chainList[id];
  if(!result){
    return;
  }
  result.done = value;
}
//===============================================================================
export default {
  /**
   * 获得一个chain对象
   * @param {Array} list [required] 需要进行链式执行的函数队列
   * @param {Function} complete [optional] 执行完毕所有函数后的回调
   * 遵从`function(error[,data])`
   * - error 如果队列执行中发生错误，将作为第一个参数被返回
   * - data 如果最后一次调用`next()`传入了参数，参数将会作为回调函数的参数被返回
   * @param {*} scope 希望队列中的函数和回调函数中的this指向
   */
  getChain(list,complete,scope){
    if(list && list.length>0){
      return new Chain(list,complete,scope);
    }
  }
};
