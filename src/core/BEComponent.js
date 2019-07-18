//=======================================================
/**
 * @description 小程序应用组件代理对象工厂
 * @author Brave Chan on 2019.5
 * @version 1.0.3
 */
//=======================================================
import { combineGlobalData, clearOriginData  } from './beconst';
import { isFunction, assignObjExcept } from '../util';
import { COMPONENT_TYPE } from '../nodeType';
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
 * @private
 * @description 合成created函数
 * @param {function} created [required] 原始created函数
 * @returns {function} 合成后的created函数
 */
function combineCreated(created, isFunction, be_invokeInitVMP, be_invokeParse, be_invokeDecorate, COMPONENT_TYPE) {

  return function () {
    if (!this) {
      console.error('In Component created, can not get the this obj!!', this);
    } else {
      this.be_nodeType = COMPONENT_TYPE;
      this.vmp = be_invokeInitVMP(this);
    }

    if (this && this.vmp) {
      be_invokeDecorate(this, this.vmp);
      be_invokeParse(this, this.vmp);
    }

    if (isFunction(created)) {
      created.call(this);
    }
  };
}

/**
 * @private
 * @description 合成attached函数
 * @param {function} attached [required] 原始的attached函数
 * @returns {function} 合成后的attached函数
 */
function combineAttached(attached, isFunction) {
  return function () {

    if (isFunction(attached)) {
      attached.call(this);
    }
  };
}

/**
 * @private
 * @description 合成detached函数
 * @param {function} detached [required] 原始detached函数
 * @returns {function} 合成后的detached函数
 */
function combineDetached(detached, isFunction, be_invokeWash, be_invokeDestroyVMP) {
  return function () {
    if (this && this.vmp) {
      be_invokeWash(this, this.vmp);
      be_invokeDestroyVMP(this, this.vmp);
    }
    if (isFunction(detached)) {
      detached.call(this);
    }
  };
}

/**
 * @private
 * @description 合成组件生命周期
 * @param {object} component [required] 原始的声明式对象
 * @returns {object} 合成后的生命周期
 */
function combineComponentLife(component = {}) {
  return {
    created: combineCreated(component.created, isFunction, be_invokeInitVMP, be_invokeParse, be_invokeDecorate, COMPONENT_TYPE),
    attached: combineAttached(component.attached, isFunction),
    detached: combineDetached(component.detached, isFunction, be_invokeWash, be_invokeDestroyVMP),
    ready: component.ready,
    moved: component.moved,
    error: component.error
  };
}

/**
 * @private
 * @description 合成页面的生命周期响应函数
 * @param {object} pageLifetimes [required] 原始页面生命周期函数集合
 * @returns {object} 合成后的生命周期函数集合
 */
function combinePageLife(pageLifetimes = {}) {
  return {
    show: (function (fn, isFunction) {
      return function (options) {
        //when page onShow, commit the props that collected during onHide be invoked.

        if (isFunction(fn)) {
          fn.call(this, options)
        }
      };
    })(pageLifetimes.show, isFunction),

    hide: (function (fn, isFunction) {
      return function () {
        // when page onHide, pause the props validate.
        if (isFunction(fn)) {
          fn.call(this);
        }
      };
    })(pageLifetimes.hide, isFunction),
    resize: pageLifetimes.resize
  };
}

//=======================================================
/**
 * @public
 * @description 组件代理对象工厂
 * @param {object} component [required] 原始组件对象
 * @returns {object} 合成后的适用于小程序Component()的对象
 */
export default function BEComponent(component = {}) {
  let data = combineGlobalData(component.data);
  be_invokeOriginPares(component, COMPONENT_TYPE);
  let obj = {
    data,
    vmp: null,
    be_nodeType: COMPONENT_TYPE,
    lifetimes: combineComponentLife(component),
    pageLifetimes: combinePageLife(component.pageLifetimes)
  };

  let result = assignObjExcept(obj, component, [
    'created',
    'attached',
    'detached',
    'ready',
    'moved',
    'error',
    'lifetimes',
    'pageLifetimes',
    'data'
  ]);

  clearOriginData(component);
  component = null;
  return result;
};
//=======================================================
