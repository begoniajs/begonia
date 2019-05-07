/**
 * @description VMP管理
 * @author Brave Chan on 2019.5
 * @version 1.0.0
 */
//==============================================================
import VMP from './ViewModelProxy';
import { VMO_ID } from './besConst';
import { isFunction } from '../util';
import { addVMP, getVMPs, removeVMP, hasVMP } from './proxyCollect';
import { setDebug, setInterval } from './updateProxys';

let _debug = false;

function createVMP(master) {
  let vmp = new VMP(master);
  vmp.debug = _debug;
  master[VMO_ID] = vmp.id;
  addVMP(vmp);
  return vmp;
}

export default {
  get debug() {
    return _debug;
  },
  set debug(value) {
    _debug = !!value;
    setDebug(_debug);
  },
  set interval(value) {
    setInterval(value || 100);
  },
  get be_vmList() {
    return getVMPs();
  },
  get isVMP() {
    return true;
  },
  /**
   * @description 模块生命周期-启动
   * @param {*} config
   */
  setup(config) {
    this.debug = config.debug;

    return {
      'VMP': getVMPs
    };
  },
  /**
   * @description 模块生命周期-初始化vmp
   * @param {*} master
   */
  initVMP(master) {
    if (!master) {
      if (_debug) {
        console.error('In beStates initVMP(), can not get the master.', master);
      }
      return {
        isError: true,
        message: 'Can not find the master'
      };
    }

    return createVMP(master);
  },
  /**
   * @description 模块生命周期-解析
   * @param {*} master
   * @param {*} vmp
   */
  parse(master = {}, vmp = {}) {
    if (!master.data) {
      return;
    }

    let props = Object.keys(master.data).reduce(function(prev, item) {
      prev[item] = {
        get() {
          return this.data[item];
        },
        set(value) {
          this.commit(item, value);
        }
      };
      return prev;
    }, {});
    Object.defineProperties(master, props);
  },
  /**
   * @description 模块生命周期-装饰
   * @param {*} master
   * @param {*} vmp
   */
  decorate(master, vmp) {
    if (!master.data) {
      return;
    }
    master.commit = function(...args) {
      if (this.vmp) {
        this.vmp.commit.apply(this.vmp, args);
      }
    };
    master.validateNow = function() {
      if (this.vmp) {
        this.vmp.validateNow();
      }
    };
  },
  /**
   * @description 模块生命周期-清洗
   * @param {*} master
   * @param {*} vmp
   */
  wash(master, vmp) {
    if (isFunction(master.commit)) {
      master.commit = null;
    }

    if (isFunction(master.validateNow)) {
      master.validateNow = null;
    }
  },
  /**
   * @description 模块生命周期-销毁vmp
   * @param {*} master
   * @param {*} vmp
   */
  destroyVMP(master, vmp) {
    let id = vmp.id;
    if (!hasVMP(id)) {
      return;
    }
    removeVMP(id);
    master[VMO_ID] = null;
    master.vmp = null;
    vmp.destroy();
  }
};
