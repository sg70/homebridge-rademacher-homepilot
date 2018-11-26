var request = require("request");
var tools = require("./tools.js");

function RademacherBlindsAccessory(log, accessory, blind, url, inverted) {
    var self = this;

    var info = accessory.getService(global.Service.AccessoryInformation);

    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(global.Characteristic.Manufacturer, accessory.context.manufacturer.toString());

    accessory.context.model = blind.productName;
    info.setCharacteristic(global.Characteristic.Model, accessory.context.model.toString());

    accessory.context.serial = blind.serial;
    info.setCharacteristic(global.Characteristic.SerialNumber, accessory.context.serial.toString());

    this.inverted = inverted;
    this.accessory = accessory;
    this.blind = blind;
    this.log = log;
    this.url = url;
    this.lastPosition = this.inverted ? tools.reversePercentage(this.blind.position) : this.blind.position;
    this.currentPositionState = 2;
    this.currentTargetPosition = 100;

    this.service = accessory.getService(global.Service.WindowCovering);

    this.service
        .getCharacteristic(global.Characteristic.CurrentPosition)
        .setValue(self.inverted ? tools.reversePercentage(self.blind.position) : self.blind.position)
        .on('get', this.getCurrentPosition.bind(this));

    this.service
        .getCharacteristic(global.Characteristic.TargetPosition)
        .setValue(self.inverted ? tools.reversePercentage(self.blind.position) : self.blind.position)
        .on('get', this.getTargetPosition.bind(this))
        .on('set', this.setTargetPosition.bind(this));

    this.service.getCharacteristic(global.Characteristic.PositionState)
        .setValue(this.currentPositionState)
        .on('get', this.getPositionState.bind(this));

    accessory.updateReachability(true);
}

RademacherBlindsAccessory.prototype.setTargetPosition = function(value, callback) {
    this.log("%s - Setting target position: %s", this.accessory.displayName, value);

    var self = this;
    this.currentTargetPosition = value;
    var moveUp = (this.currentTargetPosition >= this.lastPosition);
    this.service.setCharacteristic(global.Characteristic.PositionState, (moveUp ? 1 : 0));
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
            self.service.setCharacteristic(global.Characteristic.PositionState, 2);
            self.lastPosition = self.currentTargetPosition;
            callback(null, self.currentTargetPosition);
        }
    });
};

RademacherBlindsAccessory.prototype.getTargetPosition = function (callback) {
    this.log("%s - Getting target position", this.accessory.displayName);

    var self = this;
    var did = this.blind.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed."), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.did == did)
            {
                var pos = self.inverted ? tools.reversePercentage(data.position) : data.position;
                self.currentTargetPosition = pos;
                callback(null, pos);
            }
        });
    });
};

RademacherBlindsAccessory.prototype.getCurrentPosition = function (callback) {
    this.log("%s - Getting current position", this.accessory.displayName);

    var self = this;
    var did = this.blind.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.did == did)
            {
                var pos = self.inverted ? tools.reversePercentage(data.position) : data.position;
                callback(null, pos);
            }
        });
    });
};

RademacherBlindsAccessory.prototype.getPositionState = function(callback) {
    callback(null, this.currentPositionState);
};

module.exports = RademacherBlindsAccessory;