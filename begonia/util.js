//=======================================================
/**
 * @description 工具函数集合
 * @auhtor Brave Chan on 2017
 * @version 1.0.0
 */
//=======================================================

/**
 * @internal
 * @description 格式化时间
 * @param {Number} num [required] 从1970.1.1至今的毫秒数
 * @param {*} limit 是否只返回y-m-d的形式
 */
function formatTime(num, limit = true, noSecond = false) {
  if (typeof num !== 'number' || !Number.isInteger(+num)) {
    return num;
  }
  const date = new Date(num);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const ymd = [year, month, day].map(formatNumber).join('-');
  if (limit) {
    return ymd;
  }

  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  let list = [hour, minute, second];
  if (noSecond) {
    list = list.slice(0, list.length - 1);
  }

  return ymd + ' ' + list.map(formatNumber).join(':')
}

/**
 * @internal
 * @description 空函数
 */
function noop() { }

/**
 * @internal
 * @description 格式化分秒数字
 */
function formatNumber(n) {
  n = n.toString();
  return n[1] ? n : '0' + n;
}

/**
 * @internal
 * @description 随机字符串
 */
function randomStr() {
  let str;
  str = (0xffffff * Math.random()).toString(16).replace(/\./g, '');
  return str;
}

/**
 * @internal
 * @description 随机字符串组成的id
 */
function getSysId() {
  return `${randomStr()}-${randomStr()}`;
}

/**
 * @internal
 * @description 是否是布尔型
 * @param {*} value
 */
function isBoolean(value) {
  return typeof value === 'boolean';
}

/**
 * @internal
 * @description 是否是数组
 * @param {*} value
 */
function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

/**
 * @internal
 * @description 是否是纯对象
 * @param {*} value
 */
function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * @internal
 * @description 是否是函数
 * @param {*} value
 */
function isFunction(value) {
  return typeof value === 'function';
}

/**
 * @internal
 * @description 快速深度复制
 * @param {*} obj
 */
function quickDeepCopy(obj) {
  let newOne;
  try {
    newOne = JSON.parse(JSON.stringify(obj));
  } catch (error) {
    return newOne;
  }
  return newOne;
}

/**
 * @internal
 * @description 反序列化
 * 针对{xxx='22',xxx='44'}的情况
 * 华为meta9中出现的特例（修复与否需要验证）
 * @param {String} str [required] '{xxx='22',xxx='44'}'形式的数据
 */
function unserialize(str) {
  if (str[0] === "{" && str[str.length - 1] === "}") {
    str = str.slice(1, str.length - 1);
  }
  let list = str.match(/([a-zA-Z]+)=([^\s=,]+)/g);
  if (!list) {
    return;
  }
  let obj = {};
  let len = list.length;
  while (len--) {
    let ary = list[len].split("=");
    obj[ary[0]] = ary[1];
  }
  return obj;
}

/**
 * @internal
 * @description 自增数字生成器
 * @param {*} start
 * @param {*} step
 */
function autoincrement(start, step) {
  return (function (s = 0, t = 1, i = -1) {
    return function () {
      return (0x000000 + s + (i += t)).toString(16);
    };
  })(start, step);
}
//=======================================================
/**
 * @internal
 * @description 是否绝对为null或undefined，能够判断'null'和'undefined'情况
 * @param {*} value
 */
function isANothing(value) {
  return value === void 0 || value === null || value === 'undefined' || value === 'null';
}

/**
 * @internal
 * @description 是否为null或undefined
 * @param {*} value
 */
function isNothing(value) {
  return value === void 0 || value === null;
}

/**
 * @internal
 * @description 将一个对象合并到目标对象，但是排除except中指定的键名
 * @param {*} target
 * @param {*} from
 * @param {*} except
 */
function assignObjExcept(target, from, except = []) {
  return Object.keys(from).reduce(function(prev, item) {
    if (except.indexOf(item) >= 0) {
      return prev;
    }
    prev[item] = from[item];
    return prev;
  }, target);
}

//================================================================
export {
  formatTime,
  randomStr,
  noop,
  getSysId,
  isBoolean,
  isArray,
  isObject,
  quickDeepCopy,
  unserialize,
  isANothing,
  isNothing,
  isFunction,
  assignObjExcept,
  autoincrement
};
//=======================================================