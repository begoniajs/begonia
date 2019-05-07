/**
 * 小程序sdk版本检测
 * @author Brave Chan on 2018.5.4
 */
//===========================================
let _currentVersion = "0.0.0";
let _targetVersion = "0.0.0";
//===========================================
/**
 * 检查比较2个版本号
 * @param {String} currentVersion [required] 当前版本
 * @param {String} baseVersion [required] 基础版本
 * @param {Function} cb [optional] 结果回调
 */
function check(currentVersion,baseVersion,cb){
    let result = compareVersion(currentVersion,baseVersion);
    if(result !== -1){
        return;
    }
    if(typeof cb === 'function'){
        cb();
    }
}
/**
 *
 * @param {*} v1
 * @param {*} v2
 */
function compareVersion(v1, v2) {
    v1 = v1.split('.');
    v2 = v2.split('.');
    var len = Math.max(v1.length, v2.length);

    while (v1.length < len) {
        v1.push('0');
    }
    while (v2.length < len) {
        v2.push('0');
    }

    for (var i = 0; i < len; i++) {
        var num1 = parseInt(v1[i]);
        var num2 = parseInt(v2[i]);

        if (num1 > num2) {
            return 1;
        } else if (num1 < num2) {
            return -1;
        }
    }
    return 0;
}

//===========================================
export default {
    set currentVersion(value){
        _currentVersion = value;
    },
    get currentVersion(){
        return _currentVersion;
    },

    set targetVersion(value){
        _targetVersion = value;
    },
    get targetVersion(){
        return _targetVersion;
    },

    check,
}
