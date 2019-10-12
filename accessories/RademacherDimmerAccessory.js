
var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherDimmerAccessory(log, accessory, dimmer, session) {
    RademacherAccessory.call(this, log, accessory, dimmer, session);
    var self = this;

    this.dimmer = dimmer;
    this.lastBrightness = this.dimmer.brightness;
    this.currentBrightness = 2;
    this.currentStatus = 100;

    this.service = this.accessory.getService(global.Service.Lightbulb);

    this.service.getCharacteristic(global.Characteristic.On)
        .on('get', this.getStatus.bind(this))
        .on('set', this.setStatus.bind(this));

    this.service.getCharacteristic(global.Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));

    this.accessory.updateReachability(true);

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherDimmerAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherDimmerAccessory.prototype.getStatus = function(callback) {
    this.log("%s [%s] - Getting current state", this.accessory.displayName, this.dimmer.did);

    var self = this;

    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.statusesMap.Position;
        callback(null, (pos>0?true:false));
    });
};

RademacherDimmerAccessory.prototype.setStatus = function(status, callback, context) {
    if (context) {
        this.on = status;
        this.log("%s  [%s] - Setting dimmer: %s", this.accessory.displayName, this.dimmer.did, status);

        var self = this;
        this.currentState = status;
        var changed = (this.currentState != this.lastState);
        this.log("%s  [%s] - dimmer changed=%s", this.accessory.displayName,self.dimmer.did,changed);
        if (changed)
        {            
            var params = {name: this.lastState?"TURN_OFF_CMD":"TURN_ON_CMD"};
            this.session.put("/devices/"+this.blind.did, params, 2500, function(e) {
                if(e) return callback(new Error("Request failed: "+e), false);
                self.lastState = self.currentState;
                callback(null, self.currentState);
            });
        }
        else
        {
            return callback(null,this.currentState);
        }
    }
};

RademacherDimmerAccessory.prototype.getBrightness = function(callback) {
    this.log("%s [%s] - Getting current brightness", this.accessory.displayName, this.dimmer.did);

    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.statusesMap.Position;
        callback(null, pos);
    });
};

RademacherDimmerAccessory.prototype.setBrightness = function(brightness, callback, context) {
    if (context) {
        this.log("%s [%s] - Setting target brightness: %s", this.accessory.displayName, this.dimmer.did, brightness);
        var self = this;
        this.currentBrightness = brightness;
        this.service.setCharacteristic(Characteristic.Brightness,brightness);
        var params = {name: "GOTO_POS_CMD", value: brightness};
        this.session.put("/devices/"+this.blind.did, params, 2500, function(e) {
            if(e) return callback(new Error("Request failed: "+e), false);
            callback(null, self.currentBrightness);
        });
}
};

RademacherDimmerAccessory.prototype.update = function() {
    this.log(`Updating %s [%s]`, this.accessory.displayName, this.dimmer.did);
    var self = this;

    // Status
    this.getStatus(function(foo, state) {
        self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
    }.bind(this));

    // Brightness
    this.getBrightness(function(foo, brightness) {
        self.service.getCharacteristic(Characteristic.Brightness).setValue(brightness, undefined, self.accessory.context);
    }.bind(this));


};

RademacherDimmerAccessory.prototype.getServices = function() {
    return [this.service];
};

module.exports = RademacherDimmerAccessory;
