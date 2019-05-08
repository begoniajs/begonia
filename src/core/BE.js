//=======================================================
/**
 * @description 小程序应用根级代理对象工厂
 * @author Brave Chan on 2019.5
 * @version 1.0.2
 */
//=======================================================
import { isFunction, assignObjExcept } from '../util';
import { combineGlobalData, clearOriginData } from './beconst';
import { APP_TYPE } from '../nodeType';
import {
  be_invokeOriginPares,
  be_invokeInitVMP,
  be_invokeParse,
  be_invokeDecorate
} from './BEModules';
//=======================================================
/**
 * @public
 * @description 根级代理工厂，也作为begonia的全局命名空间
 *
 * @param {object} app [required] 声明式开发对象
 * @returns {object} 适用于小程序App()的对象
 */
export default function BE(app = {}) {
  let data = combineGlobalData(app.data);
  be_invokeOriginPares(app, APP_TYPE);
  let obj = {
    vmp: null,
    be_Root: true,
    be_nodeType: APP_TYPE,
    globalData: data,

    onLaunch: (function(fn, isFunction, be_invokeInitVMP, be_invokeParse, be_invokeDecorate) {
      return function(options) {
        if (!this) {
          console.error('In App onLaunch, can not get the this obj!!', this);
        } else {
          this.vmp = be_invokeInitVMP(this);
          be_invokeParse(this, this.vmp);
          be_invokeDecorate(this, this.vmp);
        }
        if (isFunction) {
          fn.call(this, options);
        }
      };
    })(app.onLaunch, isFunction, be_invokeInitVMP, be_invokeParse, be_invokeDecorate),

    onShow: (function(fn, isFunction) {
      return function(options) {

        if (isFunction(fn)) {
          fn.call(this, options);
        }
      };
    })(app.onShow, isFunction)
  };

  let result = assignObjExcept(obj, app, ['globalData', 'onLaunch', 'onShow', 'data']);
  clearOriginData(app);
  app = null;
  return result;
};
//=======================================================
