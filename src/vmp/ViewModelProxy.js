//=========================================================
/**
 * @description ViewModelProxy对象
 * @author Brave Chan on 2019.5
 * @version 1.0.0
 */
//=========================================================
import { getSysId, isObject } from '../util';
import { addUpdate, removeUpdate } from './updateProxys';
//=========================================================
/**
 * 执行属性变动提交
 * @param {object} obj [required] 需要生效的属性集合
 */
function doCommit(obj = {}) {
  //如果正在执行渲染，则先加入缓存对象
  if (this.rendering) {
    if (this._debug) {
      console.log("In VMP commit(),the vmp is rendering, will commit into cache now.==>", obj);
    }
    Object.assign(this.cache, obj);
  } else {
    Object.assign(this.optData, obj);
  }

  if (this._debug) {
    console.info("In VMP commit(),commit prop==>", obj);
  }

  addUpdate(this.id);
}
//=========================================================
export default class VMProxy {
  constructor(master = {}) {
    this.id = getSysId();
    this.optData = {};
    this.cache = {};
    this.master = master;
    this.rendering = false;
    this._debug = false;
  }
  get debug() {
    return this._debug;
  }

  set debug(value = false) {
    this._debug = !!value;
  }
  /**
   * @public
   * @description 提交属性变动
   * @param {*} prop
   * @param {*} value
   */
  commit(prop, value) {
    if (typeof prop === 'string') {
      doCommit.call(this, { [prop]: value });
    } else if (isObject(prop)) {
      doCommit.call(this, prop);
    }

    return this;
  }
  /**
   * @public
   * @description 属性变动生效
   */
  validate() {
    if (!this.optData || !Object.keys(this.optData).length > 0) {
      return;
    }

    let canUse = !this.rendering && this.master && typeof this.master.setData === 'function';

    if (canUse) {
      if (this._debug) {
        console.info("In VMP validate(),The vm will validate props===>", this.optData);
      }
      this.rendering = true;
      this.master.setData(this.optData, () => {
        this.rendering = false;
        //重置对象等待下一次
        this.optData = this.cache;
        this.cache = {};

        //如果有需要更新的，并且不再渲染列表，则加入
        let keys = Object.keys(this.optData);
        if (keys.length > 0) {
          addUpdate(this.id);
        }
      });
    } else {
      if (!this._debug) {
        return;
      }

      if (this.rendering) {
        if (this._debug) {
          console.info("In VMP validate(),the vm is rendering, please wait next loop. The cache ====>", this.cache);
        }
        return;
      }
      if (this.master && typeof this.master.setData !== 'function') {
        if (this._debug) {
          console.info("In VMP validate(), master do not have setData function.");
        }
        return;
      }

      console.error("In VMP validate(),the scope/master error");
    }
  }
  /**
   * @public
   * @description 属性变动立即生效
   */
  validateNow() {
    removeUpdate(this.id);
    this.validate();
  }
  /**
   * @public
   * @description 销毁vmp，不可再用
   */
  destroy() {
    removeUpdate(this.id);
    this.optData = null;
    this.cache = null;
    this.master = null;
    this.rendering = null;
    this.id = null;
  }
};
//=========================================================


