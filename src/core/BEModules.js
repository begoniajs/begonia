//=======================================================
/**
 * @description 模块加载、模块生命周期
 * @author Brave Chan on 2019.5
 * @version 1.0.0
 */
//=======================================================
import { getSysId, isObject, isFunction } from '../util';
//=======================================================
const M_ID = 'be_m_id$';
// debug开关
let _debug = false;
// 模块实体集合
let m_collect = {};
// 模块id结合
let m_ids = [];
// 模块生命周期需求清单列表
let m_lifeCycles = {
  originParse: [],
  initVMP: [],
  parse: [],
  decorate: [],
  wash: [],
  destroyVMP: []
};
// VMP模块id
let VMP_ID = '';
// 全局附加函数
let moduleGlobal = {};
//=======================================================

/**
 * @private
 * @description 初始化模块设置
 * @param {Object} data [required]
 */
function initModule({ am, M_ID, _debug }) {
  let id = getSysId();
  am[M_ID] = id;
  am.debug = _debug;
  if (am.isVMP) {
    VMP_ID = id;
  }
}

/**
 * @private
 * @description 加入模块列表
 * @param {Object} data [required]
 */
function toModules({ am, M_ID, m_ids, m_collect }) {
  m_ids[m_ids.length] = am[M_ID];
  m_collect[am[M_ID]] = am;
}

/**
 * @private
 * @description 添加声明周期
 * @param {Object} data [required]
 */
function addLifeCycle({ am, m_lifeCycles, M_ID }) {
  let lifes = Object.keys(m_lifeCycles);

  for (let key of lifes) {
    if (isFunction(am[key])) {
      m_lifeCycles[key].push(am[M_ID]);
    }
  }
}

/**
 * @private
 * @description 启动模块
 * @param {Object} data [required]
 */
function setupModule({ am, config, moduleGlobal }) {
  if (isFunction(am.setup)) {
    let obj = am.setup(config);

    // No public temporarily
    // add special module method
    if (isObject(obj)) {
      Object.assign(moduleGlobal, obj);
    }
  }
  return am;
}

/**
 * @private
 * @description 调用模块声明周期中的钩子
 * @param {Object} lifeCycle [required]
 */
function invokeLifeCycle(lifeCycle, ...args) {
  let list = m_lifeCycles[lifeCycle];
  list.forEach(function(item) {
    let m = m_collect[item];
    if (m) {
      m[lifeCycle].apply(m, args);
    }
  });
}
//=========================================================
/**
 * @internal
 * @description 处理注册originParse阶段的模块
 * @param {Object} obj [required] 原始声明式数据
 * @param {Number} type [required] 节点类型
 */
function be_invokeOriginPares(obj = {}, type = 0) {
  let list = m_lifeCycles.originParse;
  if (list.length <= 0) {
    return;
  }

  for(let value of list) {
    let am = m_collect[value];
    am.originParse(obj, type);
  }
}

/**
 * @internal
 * @description 处理注册initVMP阶段的模块
 * @param {Object} master [required] 宿主对象
 */
function be_invokeInitVMP(master) {
  let VMP = m_collect[VMP_ID];
  if (!VMP) {
    console.error('In beModules be_invokeInitVMP(), can not find the VMP module!', VMP_ID);
    return {};
  }

  return m_lifeCycles.initVMP.reduce(function(prev, item) {
    let m = m_collect[item];
    if (!m) {
      return prev;
    }
    return m.initVMP(master);
  }, {}) || {};
}

/**
 * @internal
 * @description 处理注册parse阶段的模块
 * @param {Object} master [required] 宿主对象
 * @param {Object} vmp [required] 代理对象
 */
const be_invokeParse = (master, vmp) => invokeLifeCycle('parse', master, vmp);
/**
 * @internal
 * @description 处理注册decorate阶段的模块
 * @param {Object} master [required] 宿主对象
 * @param {Object} vmp [required] 代理对象
 */
const be_invokeDecorate = (master, vmp) => invokeLifeCycle('decorate', master, vmp);
/**
 * @internal
 * @description 处理注册wash阶段的模块
 * @param {Object} master [required] 宿主对象
 * @param {Object} vmp [required] 代理对象
 */
const be_invokeWash = (master, vmp) => invokeLifeCycle('wash', master, vmp);
/**
 * @internal
 * @description 处理注册destroyVMP阶段的模块
 * @param {Object} master [required] 宿主对象
 * @param {Object} vmp [required] 代理对象
 */
const be_invokeDestroyVMP = (master, vmp) => invokeLifeCycle('destroyVMP', master, vmp);

/**
 * @internal
 * @description 处理注册beforeUnload阶段的模块
 * @param {Object} master [required] 宿主对象
 * @param {Object} vmp [required] 代理对象
 */
function be_invokeBeforeUnload(am) {
  if (!am || !am[M_ID] || !m_collect[am[M_ID]]) {
    return;
  }
  // exec beforeUnload
  am.beforeUnload();
  // exec wash vmp
  if (isFunction(am.wash)) {
    let vmList = moduleGlobal['VMP']() || {};
    let ids = Object.keys(vmList);
    let len = ids.length;
    while (len--) {
      let vmp = vmList[ids[len]];
      if (vmp) {
        am.wash(vmp.master, vmp);
      }
    }
  }
  // remove am in lifeCycle
  let keys = Object.keys(am);
  keys.forEach(function(item) {
    let list = m_lifeCycles[item] || [];
    let index = list.indexOf(am[M_ID]);
    if (isFunction(am[item]) && index >= 0) {
      m_lifeCycles[item].splice(index, 1);
    }
  });
  // remove am from m_ids & m_collect
  let index = m_ids.indexOf(am[M_ID]);
  if (index >= 0) {
    m_collect[am[M_ID]] = null;
  }
  // remove am id
  am[M_ID] = void 0;
}

/**
 * @internal
 * @description 处理注册destroy阶段的模块
 * @param {Object} master [required] 宿主对象
 * @param {Object} vmp [required] 代理对象
 */
function be_invokeDestroy(am) {
  if (!am) {
    return;
  }
  // if am in m_collect, first unload am
  if (m_collect[am[M_ID]]) {
    be_invokeBeforeUnload(am);
  }
  // invoke am.destroy()
  am.destroy();
}
//=========================================================
/**
 * @public
 * @description 增加程序运行中需要使用的增强模块
 * @param {Object} addModule [required] 增强模块
 * @param {Object} config [optional] 模块设置
 * 如果设置了`config`参数并且模块也提供了`setup`方法，
 * 那么这个`config`对象将会作为`setup()`的参数传入模块中。
 * 模块利用其进行初始化配置。
 */
function use(addModule = {}, config = {}) {
  let am = addModule;
  if (!isObject(am) || !!am[M_ID]) {
    return;
  }

  [
    initModule,
    toModules,
    addLifeCycle,
    setupModule
  ].reduce(function(prev, item) {
    item(prev);
    return prev;
  }, { am, config, M_ID, m_ids, m_collect, m_lifeCycles, _debug, moduleGlobal });

}

/**
 * @public
 * @description 卸载模块
 * @param {Object} addModule [required] 增强模块
 */
function unload(addModule = {}) {
  be_invokeBeforeUnload(addModule);
}

/**
 * @public
 * @description 销毁模块
 * @param {Object} addModule [required] 增强模块
 */
function destroyModule(addModule = {}) {
  be_invokeDestroy(addModule);
}

/**
 * @public
 * @description 设置模块们的debug模式
 * @param {Boolean} debug [required]
 */
function setModulesDebug(debug) {
  for (let id of m_ids) {
    let m = m_collect[id];
    if (m) {
      m.debug = debug;
    }
  }
}

//=========================================================
export {
  use,
  unload,
  destroyModule,
  setModulesDebug,
  be_invokeOriginPares,
  be_invokeInitVMP,
  be_invokeParse,
  be_invokeDecorate,
  be_invokeWash,
  be_invokeDestroyVMP,
  be_invokeBeforeUnload,
  be_invokeDestroy
};
//=======================================================