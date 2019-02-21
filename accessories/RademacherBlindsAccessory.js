var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherBlindsAccessory(log, accessory, blind, url, inverted) {
    RademacherAccessory.call(this, log, accessory, blind, url);

    this.inverted = inverted;
    this.blind = blind;
    this.lastPosition = this.inverted ? tools.reversePercentage(this.blind.position) : this.blind.position;
    this.currentTargetPosition = this.blind.position;

    this.service = this.accessory.getService(global.Service.WindowCovering);

    this.service
        .getCharacteristic(global.Characteristic.CurrentPosition)
        .setValue(this.inverted ? tools.reversePercentage(this.blind.position) : this.blind.position)
        .on('get', this.getCurrentPosition.bind(this));

    this.service
        .getCharacteristic(global.Characteristic.TargetPosition)
        .setValue(this.inverted ? tools.reversePercentage(this.blind.position) : this.blind.position)
        .on('get', this.getTargetPosition.bind(this))
        .on('set', this.setTargetPosition.bind(this));

    this.service.getCharacteristic(global.Characteristic.PositionState)
        .setValue(global.Characteristic.PositionState.STOPPED)
        .on('get', this.getPositionState.bind(this));

    this.service.getCharacteristic(Characteristic.ObstructionDetected)
        .setValue(this.blind.hasErrors)
        .on('get', this.getObstructionDetected.bind(this));

    this.accessory.updateReachability(true);
}

RademacherBlindsAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherBlindsAccessory.prototype.setTargetPosition = function(value, callback) {
    this.log("%s - Setting target position: %s", this.accessory.displayName, value);

    var self = this;
    this.currentTargetPosition = value;
    var moveUp = (this.currentTargetPosition >= this.lastPosition);
    this.service.setCharacteristic(global.Characteristic.PositionState,
        (moveUp ? global.Characteristic.PositionState.INCREASING : global.Characteristic.PositionState.DECREASING));
    var target = self.inverted ? tools.reversePercentage(value) : value;

    var params = "cid=9&did="+this.blind.did+"&command=1&goto="+ target;
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: this.url + "/deviceajax.do",
        body: params
    }, function(e,r,b){
        if(e) return callback(new Error("Request failed."), false);
        if(r.statusCode == 200)
        {
            self.service.setCharacteristic(global.Characteristic.CurrentPosition, self.currentTargetPosition);
            self.service.setCharacteristic(global.Characteristic.PositionState, global.Characteristic.PositionState.STOPPED);
            self.lastPosition = self.currentTargetPosition;
            callback(null, self.currentTargetPosition);
        }
    });
};

RademacherBlindsAccessory.prototype.getTargetPosition = function(callback) {
    this.log("%s - Getting target position", this.accessory.displayName);

    var self = this;

    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = self.inverted ? tools.reversePercentage(d.position) : d.position;
        self.currentTargetPosition = pos;
        callback(null, pos);
    });
};

RademacherBlindsAccessory.prototype.getCurrentPosition = function(callback) {
    this.log("%s - Getting current position", this.accessory.displayName);

    var self = this;

    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = self.inverted ? tools.reversePercentage(d.position) : d.position;
        callback(null, pos);
    });
};

RademacherBlindsAccessory.prototype.getPositionState = function(callback) {
    callback(null, global.Characteristic.PositionState.STOPPED);
};

RademacherBlindsAccessory.prototype.getObstructionDetected = function(callback) {
    this.log("%s - Getting obstruction detected", this.accessory.displayName);

    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
         callback(null, d.hasErrors);
    });
};

module.exports = RademacherBlindsAccessory;