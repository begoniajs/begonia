
const MAX_INIT_SUM = 10;
const CLEAR_TIMER = 120000;

export default class Pool{
    constructor(CLASS_FN){
        this.objList = [];
        this.ClassItem = CLASS_FN;
        this.clearTimer = null;
    }

    create(num=MAX_INIT_SUM){
        if(!this.ClassItem){
            return;
        }
        let len = num;
        let list = [];
        while(len--){
            list[list.length] = new this.ClassItem();
        }
        return list;
    }

    gain(){
        // console.log("In Pool will give a obj",this.constructor.name,this.length,(this.ClassItem || {}).name);
        if(this.objList && this.objList.length>0){
            return this.objList.pop();
        }
        this.objList = this.create();
        let obj = this.objList.pop();
        if(this.isEmpty && this.clearTimer){
            this._stopTimeClear();
        }
        return obj;
    }

    back(obj){
        // console.log("In Pool will back a obj",this.constructor.name,this.obj,this.length,(this.ClassItem || {}).name);
        obj = this.wash(obj);
        if(!obj){
            return;
        }
               
        this.objList.push(obj);
        if(!this.isEmpty && !this.clearTimer){
            this._setupTimeClear();
        }
    }

    backMany(objList=[]){
        let len = objList.length;
        while(len--){
            this.back(objList[len]);
        }
    }

    wash(obj){
        // override by sub class
        return obj;
    }

    get length(){
        return this.objList.length;
    }

    get isEmpty(){
        return this.objList.length === 0;
    }

    destroy(){
        this.objList = null;
        this.CLASS_TYPE = null;
        this._stopTimeClear();
    }

    _setupTimeClear(){
        if(this.clearTimer){
            return;
        }
        this.clearTimer = setTimeout(this._doTimeClear.bind(this),CLEAR_TIMER);
    }

    _doTimeClear(){
        if(!this.clearTimer){
            return;
        }
        this._stopTimeClear();
        // console.warn("In Pool will clear obj which not be used.",this.constructor.name,this.objectList,(this.ClassItem || {}).name);
        if(!this.objList || !this.objList.length>0){
            return;
        }
        let len = this.objList.length;
        while(len--){
            this.wash(this.objList[len]);
        }
        this.objList = [];
    }

    _stopTimeClear(){
        if(this.clearTimer){
            clearTimeout(this.clearTimer);
        }
        this.clearTimer = null;
    }
}