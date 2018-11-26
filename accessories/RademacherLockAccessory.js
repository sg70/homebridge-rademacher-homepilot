class RademacherLockAccessory {

    constructor(log, accessory, sw, url) {
    this.log = log;
    this.sw = sw;
    this.url = url;
    this.accessory = accessory;
    this.lockservice = accessory.getService(Service.LockMechanism);
    
    this.lockservice
        .getCharacteristic(Characteristic.LockCurrentState)
        .on('get', this.getState.bind(this));
    
    this.lockservice
        .getCharacteristic(Characteristic.LockTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));
        
    }

    getState(callback) {
        this.log("Get lock state of %s", this.accessory.displayName)
        callback(null, true);
    }

    setState(state, callback) {
        var self=this;
        var lockState = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";
        this.log("Set lock state of %s to %s", this.accessory.displayName,lockState);

        var params = "cid=10&did="+this.sw.did+"&command=1";
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: this.url + "/deviceajax.do",
            body: params
            }, function(e,r,b){
                if(e) return callback(new Error("Request failed."), false);
                if(r.statusCode == 200)
                {
                    // alway unlock
                    self.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
                    self.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
                    callback(null);
                }
        });
    }

    getServices() {
    return [this.lockservice];
    }

}

module.exports =  RademacherLockAccessory;