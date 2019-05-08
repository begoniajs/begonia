//======================================================
/**
 * @description begoina的入口文件,提供基本的方法
 * @author Brave Chan on 2019.5
 * @version 1.0.1
 */
//======================================================
import beStates from './vmp/beStates';
import { use, unload, destroyModule, setModulesDebug } from './core/BEModules';
import BE from './core/BE';
import BEComponent from './core/BEComponent';
import BEPage from './core/BEPage';
import { isANothing } from './util';
//=======================================================
let _debug = false;
//=======================================================
Object.defineProperties(BE, {
  debug: {
    set(value) {
      _debug = !!value;
      setModulesDebug(_debug);
    },
    get() {
      return _debug;
    }
  }
});
/**
 * @public
 * @description 增加程序运行中需要使用的增强模块
 * @param {object} addModule [required] 增强模块
 * @param {object} config [optional] 模块设置
 * 如果设置了`config`参数并且模块也提供了`setup`方法，
 * 那么这个`config`对象将会作为`setup()`的参数传入模块中。
 * 模块利用其进行初始化配置。
 */
BE.use = use;
/**
 * @public
 * @description 卸载模块
 * @param {object} addModule [required] 增强模块
 */
BE.unload = unload;
/**
 * @public
 * @description 销毁模块
 * @param {object} addModule [required] 增强模块
 */
BE.destroyModule = destroyModule;
/**
 * @public
 * @description 设置属性变更延迟生效的时间间隔
 * @param {Number} gap [required] 间隔时间
 */
BE.setInterval = function(gap) {
  if (!Number.isNaN(gap) && Number.isSafeInteger(gap) && Number.isInteger(gap)) {
    beStates.interval = gap;
  }
  return beStates.interval;
};
/**
 * @public
 * @description 组件代理对象工厂
 * @param {object} component [required] 原始组件对象
 * @returns {object} 合成后的适用于小程序Component()的对象
 */
BE.component = BEComponent;
/**
 * 页面代理对象工厂
 * @param {object} page [required] 声明式开发对象
 * @returns {object} 适用于小程序Page()的对象
 */
BE.page = BEPage;

Object.freeze(BE);

// 装载vmp模块
BE.use(beStates);
//=======================================================
/**
 * @public
 * @description 根级代理工厂，也作为begonia的全局命名空间
 *
 * @param {object} app [required] 声明式开发对象
 * @returns {object} 适用于小程序App()的对象
 */
export default BE;
//=======================================================
