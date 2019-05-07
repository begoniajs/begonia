/**
 * 自增数字生成器
 * @param {*} start
 * @param {*} step
 */
function autoincrement(start, step) {
  return (function(s = 0, t = 1, i = -1) {
    return function() {
      let safe = Number.isSafeInteger((s + (i+=t)));
      if (!safe) {
        console.error('In autoincrement at bex package, it is not a safe integer.');
        return 0;
      }
      return (s + (i+=t)).toString(16);
    };
  })(start, step);
}

/**
 * 是否是纯对象
 * @param {*} value
 */
function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isANothing(value) {
  return value === void 0 || value === null || value === 'undefined' || value === 'null';
}

function isNothing(value) {
  return value === void 0 || value === null;
}

function isFunction(value) {
  return typeof value === 'function';
}

export { autoincrement, isANothing, isNothing, isObject, isFunction };
