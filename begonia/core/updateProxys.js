import { findVMP } from './proxyCollect';

let updateList = [];
let updateTimer = null;
let _interval = 100;
let _debug = false;

/**
 * @internal
 * @description 加入更新列表
 * @param {*} vmpId
 */
function addUpdate(vmpId) {
  if (!vmpId || updateList.indexOf(vmpId) >= 0) {
    return;
  }
  updateList[updateList.length] = vmpId;
  if (!updateTimer) {
    setupTimer();
  }
}

/**
 * @internal
 * @description 从更新列表中移除
 * @param {*} vmpId
 */
function removeUpdate(vmpId) {
  let index;
  if (!vmpId || (index = updateList.indexOf(vmpId)) < 0) {
    return;
  }
  updateList.splice(index, 1);
}

/**
 * @internal
 * @description 设置时间间隔
 * @param {*} gap
 */
function setInterval(gap = 100) {
  _interval = gap;
}

/**
 * @internal
 * @description 启动计时器
 */
function setupTimer() {
  if (updateTimer) {
    return;
  }
  let list = updateList;
  updateList = [];
  updateTimer = setTimeout(function() {
    clearTimeout(updateTimer);
    updateTimer = null;
    validateVMPs(list);
    if (updateList.length > 0) {
      setupTimer();
    }
  }, _interval);
}

/**
 * @private
 * @description 属性生效
 * @param {*} vmpIds
 */
function validateVMPs(vmpIds = []) {
  for (let id of vmpIds) {
    let vmp = findVMP(id);
    if (!vmp) {
      continue;
    }
    if (_debug) {
      console.info('In updateProxys validateVMPs(), will validate the vmp ====>', vmp);
    }
    vmp.validate();
  }
}

/**
 * @internal
 * @description 设置debug模式
 * @param {*} value
 */
function setDebug(value) {
  _debug = !!value;
}

export { addUpdate, removeUpdate, setInterval, setDebug, setupTimer };
