const MAX_INIT_SUM = 10;
const CLEAR_TIMER = 120000;

/**
 * @description 通用对象池类
 * @version 1.2.0
 * @author Brave Chan
 */
export default class Pool {
  constructor(CLASS_FN) {
    this.objList = [];
    this.ClassItem = CLASS_FN;
    this.clearTimer = null;
  }

  /**
   * @public
   * @description 创建一定数目的对象进入对象池
   * @param {Number} num 对象的数量
   * @returns {Array}
   */
  create(num = MAX_INIT_SUM) {
    if (!this.ClassItem) {
      return;
    }
    let len = num;
    let list = [];
    while (len--) {
      list[list.length] = new this.ClassItem();
    }
    return list;
  }

  /**
   * @public
   * @description 获取一个对象池中的对象
   * @returns {Object}
   */
  gain() {
    if (this.objList && this.objList.length > 0) {
      return this.objList.pop();
    }
    this.objList = this.create();
    let obj = this.objList.pop();
    if (this.isEmpty && this.clearTimer) {
      this._stopTimeClear();
    }
    return obj;
  }

  /**
   * @public
   * @description 返还一个对象到对象池中
   * @param {Object} obj
   */
  back(obj) {
    obj = this.wash(obj);
    if (!obj) {
      return;
    }

    this.objList.push(obj);
    if (!this.isEmpty && !this.clearTimer) {
      this._setupTimeClear();
    }
  }

  /**
   * @public
   * @description 返还一组对象
   * @param {Array<any>} objList
   */
  backMany(objList = []) {
    let len = objList.length;
    while (len--) {
      this.back(objList[len]);
    }
  }

  /**
   * @public
   * @description 清洗对象(重置到默认状态),可被子类重写
   * @param {Object} obj
   * @returns {Object}
   */
  wash(obj) {
    // override by sub class
    return obj;
  }

  /**
   * @public
   * @description 对象池容量
   * @returns {number}
   */
  get length() {
    return this.objList.length;
  }

  /**
   * @public
   * @description 对象池是否为空
   * @returns {Boolean}
   */
  get isEmpty() {
    return this.objList.length === 0;
  }

  /**
   * @public
   * @description 销毁对象池，不可再用
   */
  destroy() {
    this.objList = null;
    this.CLASS_TYPE = null;
    this._stopTimeClear();
  }

  /**
   * @private
   * @description 启动清理计时，请不要擅自调用这个方法，以免出错
   */
  _setupTimeClear() {
    if (this.clearTimer) {
      return;
    }
    this.clearTimer = setTimeout(this._doTimeClear.bind(this), CLEAR_TIMER);
  }

  /**
   * @private
   * @description 执行清理工作，请不要擅自调用这个方法，以免出错
   */
  _doTimeClear() {
    if (!this.clearTimer) {
      return;
    }
    this._stopTimeClear();
    if (!this.objList || !this.objList.length > 0) {
      return;
    }
    let len = this.objList.length;
    while (len--) {
      this.wash(this.objList[len]);
    }
    this.objList = [];
  }

  /**
   * @private
   * @description 停止清洁计时器，请不要擅自调用这个方法，以免引起错误
   */
  _stopTimeClear() {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = null;
  }
}
