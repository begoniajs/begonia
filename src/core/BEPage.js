//=======================================================
/**
 * @description 小程序应用页面代理对象工厂
 * @author Brave Chan on 2019.5
 * @version 1.0.0
 */
//=======================================================
import { isFunction, assignObjExcept } from '../util';
import { combineGlobalData, clearOriginData } from './beconst';
import { PAGE_TYPE } from '../nodeType';
import {
  be_invokeOriginPares,
  be_invokeInitVMP,
  be_invokeParse,
  be_invokeDecorate,
  be_invokeWash,
  be_invokeDestroyVMP
} from './BEModules';
//=======================================================
/**
 * 页面代理对象工厂
 * @param {Object} page [required] 声明式开发对象
 * @returns {Object} 适用于小程序Page()的对象
 */
export default function BEPage(page = {}) {
  let data = combineGlobalData(page.data);
  be_invokeOriginPares(page, PAGE_TYPE);
  let obj = {
    data,
    vmp:null,
    be_nodeType: PAGE_TYPE,

    onLoad: (function(fn, isFunction, be_invokeInitVMP, be_invokeParse, be_invokeDecorate) {
      return function(options) {
        if (!this) {
          console.error('In Page onLaunch, can not get the this obj!!', this);
        } else {
          this.vmp = be_invokeInitVMP(this);
          be_invokeParse(this, this.vmp);
          be_invokeDecorate(this, this.vmp);
        }
        if (isFunction(fn)) {
          fn.call(this, options);
        }
      };
    })(page.onLoad, isFunction, be_invokeInitVMP, be_invokeParse, be_invokeDecorate),

    onUnload: (function(fn, isFunction, be_invokeWash, be_invokeDestroyVMP) {
      return function() {
        if (this) {
          be_invokeWash(this, this.vmp);
          be_invokeDestroyVMP(this, this.vmp);
        }
        if (isFunction(fn)) {
          fn.call(this);
        }
      };
    })(page.onUnload, isFunction, be_invokeWash, be_invokeDestroyVMP),

    onShow: (function(fn, isFunction) {
      return function(options) {
        //when instance onShow, commit the props that collected during onHide be invoked.
        if (isFunction(fn)) {
          fn.call(this, options);
        }
      };
    })(page.onShow, isFunction),

    onHide: (function(fn, isFunction) {
      return function() {
        // when instance onHide, pause the props validate.
        if (isFunction(fn)) {
          fn.call(this);
        }
      };
    })(page.onHide, isFunction)
  };

  let result = assignObjExcept(obj, page, ['onLoad', 'onUnload', 'onShow', 'onHide', 'data']);

  clearOriginData(page);
  page = null;

  return result;
};
//=======================================================