/**
 * 网络状态相关服务
 * @author Brave Chan on 2017.8.24
 */
//===============================================
let _debug = false;
//===============================================
const prompt = {
    '2g':function(goodFn,badFn){
        wx.showModal({
            title:'网络不畅',
            content:'您当前的网络环境为2G，加载数据可能会比较慢，请您耐心等候，或者更换到较好的网络环境。',
            showCancel:false,
            confirmText:'知道了',
        });
        if(typeof goodFn === 'function'){
            goodFn();
        }
    },
    'none':function(goodFn,badFn){
        wx.showModal({
            title:'网络有问题',
            content:'您当前网络环境可能出现了问题，数据完全加载不了，请您检查网络连接是否正常，谢谢。',
            showCancel:false,
            confirmText:'知道了'
        });
        if(typeof badFn === 'function'){
            badFn();
        }
    },
    'wifi':function(goodFn,badFn){
        if(typeof goodFn === 'function'){
            goodFn();
        }
    },
    '3g':function(goodFn,badFn){
        if(typeof goodFn === 'function'){
            goodFn();
        }
    },
    '4g':function(goodFn,badFn){
        if(typeof goodFn === 'function'){
            goodFn();
        }
    },
    'unknow':function(goodFn,badFn){
        wx.showModal({
            title:'网络环境不明',
            content:'无法检测您当前所在网络环境类型，如果数据加载出现问题，请您切换到较好的网络环境再使用。',
            showCancel:false,
            confirmText:'知道了'
        });
        if(typeof goodFn === 'function'){
            goodFn();
        }
    },
};
let _changeToGoodFn,_changeToBadFn;
let netChangeBad = false;
//================================================
/**
 * @public
 * 
 * 监控网络状态
 * @param {Function} changeToGoodFn 网络变好时的回调 
 * @param {Function} changeToBadFn 网络变差是的回调
 */
function watchNet(changeToGoodFn,changeToBadFn){
    _changeToGoodFn = changeToGoodFn;
    _changeToBadFn = changeToBadFn;
    if (wx.onNetworkStatusChange) {
        wx.onNetworkStatusChange(function(res){
            if(!res.isConnected){
                netChangeBad = true;
                return prompt['none'](null,_changeToBadFn);
            }
            if(netChangeBad){
                netChangeBad = false;
            }
            let fn = prompt[res.networkType];
            if(typeof fn === 'function'){
                fn(_changeToGoodFn,_changeToBadFn);
            }            
        });
    } else {
        // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
        wx.showModal({
            title: '提示',
            content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
            showCancel:false,
        });
    }    
}

/**
 * @public
 * 
 * 检测网络状态
 * @param {Function} goodFn [optional] 网络情况好时调用该回调
 * @param {Function} badFn [optional] 网络情况不好时调用该回调
 */
function checkNet(goodFn,badFn){
    wx.getNetworkType({
        success:function(res){
            // 返回网络类型, 有效值：
            // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
            //res.networkType
            let fn = prompt[res.networkType];
            if(typeof fn === 'function'){
                fn(goodFn,badFn);
            }
        },
        fail:function(error){
            if(_debug){
                console.error("In NetService checkNet(), Call wx net api error,can not check net type.====>",error);
            }
        },
    });
}
//===========================================
let sequeList = [];
let execList = {};
/**
 * 将函数加入缓存队列
 * 在网络恢复后重新执行
 * @param {Function} fn [necessary] 网络恢复后需要执行的函数 
 * @param {*} scope [optional] 函数的this指向
 * 
 * @return {Number} 队列id，用来删除缓存到队列中的函数
 */
function addSquence(fn,scope){
    if(typeof fn !== 'function'){
        return;
    }
    let id = new Date().getTime();
    execList[id] = {fn,scope};
    sequeList[sequeList.length] = id;
    return id;
}
/**
 * 执行队列中缓存的函数
 */
function execSquence(){
    if(sequeList.length<=0){
        execList = {};
        return;
    }
    let len = sequeList.length;
    for(let i=0;i<len;i++){
        let item = execList[sequeList[i]];
        if(!item || typeof item.fn !== 'function'){
            continue;
        }
        item.fn.call(item.scope);
    }
    //重置
    sequeList = [];
    execList = {};
}
/**
 * 移除队列中函数
 * @param {String | Number} id [necessary] 缓存在队列中的id 
 */
function removeItem(id){
    let index;
    if(!id || (index = sequeList.indexOf(+id))===-1 || !execList[id]){
        return;
    }
    execList[id] = null;
    sequeList.splice(sequeList.indexOf(+id),1);
}

//============================================
export default {
    set debug(value){
        _debug = value;
    },
    get debug(){
        return _debug;
    },
    /**
     * @public
     * 
     * 监控网络状态
     * @param {Function} changeToGoodFn 网络变好时的回调 
     * @param {Function} changeToBadFn 网络变差是的回调
     */
    checkNet,
    /**
     * @public
     * 
     * 检测网络状态
     * @param {Function} goodFn [optional] 网络情况好时调用该回调
     * @param {Function} badFn [optional] 网络情况不好时调用该回调
     */
    watchNet,
    /**
     * 将函数加入缓存队列
     * 在网络恢复后重新执行
     * @param {Function} fn [necessary] 网络恢复后需要执行的函数 
     * @param {*} scope [optional] 函数的this指向
     * 
     * @return {Number} 队列id，用来删除缓存到队列中的函数
     */
    addSquence,
    /**
     * 移除队列中函数
     * @param {String | Number} id [necessary] 缓存在队列中的id 
     */
    removeItem,
    /**
     * 执行队列中缓存的函数
     */
    execSquence,
};