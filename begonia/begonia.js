/**
 * @description begoina的入口文件,提供基本的方法
 * @version 1.0.0
 * @author Brave Chan on 2019.5
 */
//======================================================
import beStates from './core/beStates';
import { use, unload, destroyModule, setModulesDebug } from './core/BEModules';
import BE from './core/BE';
import BEComponent from './core/BEComponent';
import BEPage from './core/BEPage';
//=======================================================
let _debug = false;
//=======================================================

//=========================================
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
BE.use = use;
BE.unload = unload;
BE.destroyModule = destroyModule;
BE.setInterval = function(value = 100) {
  beStates.interval = value;
};
BE.component = BEComponent;
BE.page = BEPage;

Object.freeze(BE);

BE.use(beStates);
//=========================================
export default BE;
