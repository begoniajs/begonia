//=======================================================
/**
 * @description 工具函数集合
 * @author Brave Chan on 2019.5
 * @version 1.0.3
 */
//=======================================================
import {
  isANothing,
  isObject,
  isFunction
} from '../util';
//=======================================================
/**
 * @private
 * @description 合成全局data对象
 * @param {object} data  [required]
 */
function combineGlobalData(data) {
  let i = 3;
  [isANothing, isFunction, isObject].some((item, index) => item(data) ? (i = index) : false);
  return [{}, (() => isFunction(data) && data())(data), data][i] || {};
}

/**
 * @private
 * @description 清理释放原始的对象
 * @param {object} data [required] 原始数据
 */
function clearOriginData(data) {
  if (!data) {
    return;
  }
  let keys = Object.keys(data);
  for (let key of keys) {
    data[key] = null;
  }
  data = null;
}
//=======================================================
export {
  combineGlobalData,
  clearOriginData
};
//=======================================================