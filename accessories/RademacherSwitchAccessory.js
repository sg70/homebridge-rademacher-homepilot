var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSwitchAccessory(log, accessory, sw, session) {
    RademacherAccessory.call(this, log, accessory, sw, session);

    this.sw = sw;
    this.lastState = this.sw.statusesMap.Position==100?true:false;
    this.currentState = this.sw.statusesMap.Position==100?true:false;

    this.service = this.accessory.getService(global.Service.Switch);

    this.service
        .getCharacteristic(global.Characteristic.On)
        .setValue(this.sw.statusesMap.Position==100?true:false)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));

    this.accessory.updateReachability(true);

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherSwitchAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSwitchAccessory.prototype.getCurrentState = function(callback) {
    this.log("%s [%s] - getting current state", this.accessory.displayName, this.sw.did);

    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d?d.statusesMap.Position:0;
        self.log("%s [%s] - current state: %s", self.accessory.displayName, self.sw.did, pos);
        callback(null, (pos==100?true:false));
    });
};

RademacherSwitchAccessory.prototype.setCurrentState = function(value, callback) {
    this.log("%s [%s] - setting switch: %s", this.accessory.displayName, this.sw.did,value);

    var self = this;
    this.currentState = value;
    var changed = (this.currentState != this.lastState);
    this.log("%s [%s] - switch changed=%s, lastState=%s", this.accessory.displayName, this.sw.did,changed, this.lastState);
    if (changed)
    {
        var params = {name: this.lastState?"TURN_OFF_CMD":"TURN_ON_CMD"};
        this.session.put("/devices/"+this.sw.did, params, 2500, function (e) {
            if(e) return callback(new Error("Request failed: "+e), self.currentState);
            self.lastState = self.currentState;
            return callback(null, self.currentState);
        });
    }
    else
    {
        return callback(null,this.currentState);
    }
};

RademacherSwitchAccessory.prototype.update = function() {
    this.log(`%s - [%s] updating`, this.accessory.displayName, this.sw.did);
    var self = this;

    // Switch state
    this.getCurrentState(function(foo, state) {
        self.log(`%s [%s] - updating to %s`, self.accessory.displayName, self.sw.did, state);
        self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
    }.bind(this));
};

module.exports = RademacherSwitchAccessory;