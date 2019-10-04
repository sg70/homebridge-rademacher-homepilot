var tools = require("./tools.js");

function RademacherLockAccessory(log, accessory, sw, session) {
    this.log = log;
    this.sw = sw;
    this.session = session;
    this.accessory = accessory;
    this.lockservice = accessory.getService(global.Service.LockMechanism);
    
    this.lockservice
        .getCharacteristic(global.Characteristic.LockCurrentState)
        .on('get', this.getState.bind(this));
    
    this.lockservice
        .getCharacteristic(global.Characteristic.LockTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));
    
}

RademacherLockAccessory.prototype.getState =function (callback) {
    this.log("%s [%s] - get lock state (always true)", this.accessory.displayName, this.sw.did)
    callback(null, true);
}

RademacherLockAccessory.prototype.setState = function (state, callback) {
    var self=this;
    this.log("%s [%s] - unlock", this.accessory.displayName, this.sw.did)

    var params = {name: "TURN_ON_CMD"};
    this.session.put("/devices/"+this.sw.did, params, 2500, function (e) {
            if(e) return callback(new Error("Request failed: "+e), true);
            // alway unlock
            self.lockservice.setCharacteristic(global.Characteristic.LockCurrentState, global.Characteristic.LockCurrentState.UNSECURED);
            self.lockservice.setCharacteristic(global.Characteristic.LockCurrentState, global.Characteristic.LockCurrentState.SECURED)
            return callback(null, true);
    });
}

RademacherLockAccessory.prototype.getServices = function() {
    return [this.lockservice];
}

module.exports =  RademacherLockAccessory;