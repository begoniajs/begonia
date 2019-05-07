import {
  isANothing,
  isObject,
  isFunction
} from '../util';

const VMO_ID = 'vmo_id$';
const APP_TYPE = 1;
const PAGE_TYPE = 2;
const COMPONENT_TYPE = 3;

/**
 * @private
 * @description 合成全局data对象
 * @param {*} data
 */
function combineGlobalData(data) {
  let i = 3;
  [isANothing, isFunction, isObject].some((item, index) => item(data) ? (i = index) : false);
  return [{}, (() => isFunction(data) && data())(data), data][i] || {};
}

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

export {
  VMO_ID,
  combineGlobalData,
  clearOriginData,
  APP_TYPE,
  PAGE_TYPE,
  COMPONENT_TYPE
};
