/**
 * 工具函数集合
 * @auhtor Brave Chan on 2017
 */
//===================================================================

/**
 * @public
 * 格式化时间
 * @param {Number} num [necessary] 从1970.1.1至今的毫秒数 
 * @param {*} limit 是否只返回y-m-d的形式
 */
function formatTime(num, limit = true,noSecond=false) {
    if(typeof num !== 'number' || !Number.isInteger(+num)){
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
    if(noSecond){
        list = list.slice(0,list.length-1);
    }

    return ymd + ' ' + list.map(formatNumber).join(':')
}
/**
 * @public
 * 空函数
 */
function noop() {}

 /**
  * 格式化分秒数字
  */
 function formatNumber(n) {
    n = n.toString();     
    return n[1] ? n : '0' + n;
 }

 /**
  * 随机字符串
  */
 function randomStr() {
     let str;
     str = (0xffffff * Math.random()).toString(16).replace(/\./g, '');     
     return str;
 }

 /**
  * 随机字符串组成的id
  */
function getSysId(){
    return `${randomStr()}-${randomStr()}`;
}

/**
 * 是否是布尔型
 * @param {*} value 
 */
function isBoolean(value){
    return typeof value === 'boolean';
}

/**
 * 是否是数组
 * @param {*} value 
 */
function isArray(value){
    return Object.prototype.toString.call(value) === '[object Array]';
}

/**
 * 是否是纯对象
 * @param {*} value 
 */
function isObject(value){
    return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 快速深度复制
 * @param {*} obj 
 */
function quickDeepCopy(obj){
    let newOne;
    try{
        newOne = JSON.parse(JSON.stringify(obj));
    }catch(error){
        return newOne;
    }
    return newOne;
}

/**
 * 反序列化
 * 针对{xxx='22',xxx='44'}的情况
 * 华为meta9中出现的特例（修复与否需要验证）
 * @param {String} str [necessary] '{xxx='22',xxx='44'}'形式的数据
 */
function unserialize(str){
    if(str[0] === "{" && str[str.length-1] === "}"){
        str = str.slice(1,str.length-1);
    }
    let list = str.match(/([a-zA-Z]+)=([^\s=,]+)/g);
    if(!list){
        return;
    }
    let obj = {};
    let len = list.length;
    while(len--){
        let ary = list[len].split("=");
        obj[ary[0]] = ary[1];
    }
    return obj;
}
//================================================================


//================================================================
export default{
     formatTime,     
     randomStr,
     noop,
     getSysId,
     isBoolean,
     isArray,
     isObject,
     quickDeepCopy,
     unserialize, 
 }