/**
 * 代理对象集合管理
 * @author Brave Chan on 2019.5.4
 * @version 1.0.0
 */
//==================================================
// vmp存储集合
let vmpList = {};

/**
 * @internal
 * @description 添加vmp对象
 * @param {*} vmp
 */
function addVMP(vmp) {
  if (!vmp || !vmp.id) {
    return;
  }
  vmpList[vmp.id] = vmp;
}

/**
 * @internal
 * @description 移除vmp对象
 * @param {*} vmpId
 */
function removeVMP(vmpId) {
  let vmp = vmpList[vmpId];
  if (!vmp) {
    return;
  }
}

/**
 * @internal
 * @description 获取vmp集合
 */
function getVMPs() {
  return vmpList;
}

/**
 * @internal
 * @description 是否含有某个vmp对象
 * @param {*} vmpId
 */
function hasVMP(vmpId) {
  return !!vmpList[vmpId];
}

/**
 * @internal
 * @description 查找某个vmp对象
 * @param {*} vmpId
 */
function findVMP(vmpId) {
  return vmpList[vmpId]
}

//=========================================================
export { addVMP, getVMPs, removeVMP, hasVMP, findVMP };
