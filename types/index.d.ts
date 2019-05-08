/**
 * @public
 * @description 根级代理工厂，也作为begonia的全局命名空间
 *
 * @param {object} app [required] 声明式开发对象
 * @returns {object} 适用于小程序App()的对象
 */
export = BE;

/**
 * @public
 * @description 根级代理工厂，也作为begonia的全局命名空间
 *
 * @param {object} app [required] 声明式开发对象
 * @returns {object} 适用于小程序App()的对象
 */
declare function BE(app: object): object;

declare namespace BE {
  /**
   * @public
   * @description 开启/关闭 debug模式
   * @returns {Booean}
   */
  export let debug: boolean;
  /**
   * @public
   * @description 增加程序运行中需要使用的增强模块
   * @param {Object} addModule [required] 增强模块
   * @param {Object} config [optional] 模块设置
   * 如果设置了`config`参数并且模块也提供了`setup`方法，
   * 那么这个`config`对象将会作为`setup()`的参数传入模块中。
   * 模块利用其进行初始化配置。
   */
  export function use(addModule: any, config?: any): void;
  /**
   * @public
   * @description 卸载模块
   * @param {Object} addModule [required] 增强模块
   */
  export function unload(addModule: any):void;
  /**
   * @public
   * @description 销毁模块
   * @param {Object} addModule [required] 增强模块
   */
  export function destroyModule(addModule: any):void;
  /**
   * @public
   * @description 设置属性变更延迟生效的时间间隔
   * @param {Number} gap [required] 间隔时间
   */
  export function setInterval(gam: number):number;
  /**
   * 页面代理对象工厂
   * @param {Object} page [required] 声明式开发对象
   * @returns {Object} 适用于小程序Page()的对象
   */
  export function page(page: any): any;
  /**
   * @public
   * @description 组件代理对象工厂
   * @param {Object} component [required] 原始组件对象
   * @returns {Object} 合成后的适用于小程序Component()的对象
   */
  export function component(component: any): any;
}
