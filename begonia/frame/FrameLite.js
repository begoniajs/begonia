/**
 * 帧模拟
 * 
 * @author Brave Chan on 2018.3.5
 * @version v0.4.0
 */
//========================================
let initialized = false;
let cbList = [];
let timer;
let startNum = 0;
let _fps = 60;
let stopping = false;
let _debug = false;
let working = false;
//========================================================
/**
 * 初始化
 */
function initialize(){
  initialized = true;  
}

/**
 * 计算帧率
 */
function countFrameGap(){
  return Math.floor(1000/_fps);
}
/**
 * 执行帧计算
 */
function doFrame(){
  if(!working){
    clearTimeout(timer);
    return;
  }
  clearTimeout(timer);
  
  let end = new Date().getTime();
  let duration = end - startNum;
  for(let i=0,fn;(fn=cbList[i])!=null;i++){
    fn(duration);
  }  
  startFrame();
}
//===============================================================
/**
 * @public
 * 
 * 添加帧监听
 * @param {Function} handler [necessary] 每帧更新的回调函数
 */
function addFrame(handler){
  if(!handler || typeof handler !== 'function' || hasFrame(handler)){
    return;
  }
  cbList[cbList.length] = handler;

  //如果未被初始化，则进行初始化，并启动帧循环
  if(cbList.length>0 && !working){
    startFrame();
  }
}
/**
 * @public
 * 移除帧监听
 * 
 * @param {Function} handler [necessary] 移除对帧监听的回调函数 
 */
function removeFrame(handler){
  if(!hasFrame(handler)){
    return;
  }
  cbList = cbList.filter((item)=>item !== handler);
  //如果回调函数都被清空，自动停止帧循环
  if(cbList.length<=0){
    stopFrame();
    cbList = [];
  }  
}
/**
 * @public
 * 
 * 是否使用了此回调函数对帧进行了侦听
 * @param {Function} handler [necessary] 回调函数
 * 
 * @return {Boolean} 使用了true，否则false 
 */
function hasFrame(handler){
  if(!handler || typeof handler !== 'function' || cbList.length<=0){
    return false;
  }
  return cbList.indexOf(handler)>=0;
}

/**
 * @public
 * 
 * 开始帧循环
 */
function startFrame(){
  if(!cbList.length>0){
    if(_debug){
      console.warn('没有handler监听帧循环，因此初始化未完成，帧循环不会启动。');
    }
    return;
  }
  working = true;
  startNum = new Date().getTime();
  timer = setTimeout(doFrame,countFrameGap());
}
/**
 * @public
 * 
 * 结束帧循环
 */
function stopFrame(){
  if(!working){
    return;
  }
  clearTimeout(timer);
  working = false;
  startNum = 0;
}

//=============================================
export default {
  /**
   * 设置debug模式
   */
  set debug(value){
    _debug = value;
  },
  get debug(){
    return _debug;
  },
  /**
   * 销毁模块，不可再用
   */
  destroy(){
    initialized = null;
    cbList = null;
    timer = null;
    startNum = null;
    _fps = null;
    stopping = null;
    _debug = null;
  },
  //==================================
  addFrame,
  removeFrame,
  hasFrame,
  stopFrame,
  startFrame,
  set fps(value){
    if(!Number.isNaN(value) && value!==_fps){
      _fps = value;
    }
  },
  get fps(){
    return _fps;
  }
};