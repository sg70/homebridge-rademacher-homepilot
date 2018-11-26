var request = require("request");
var tools = require("./tools.js");

function RademacherSmokeAlarmAccessory(log, accessory, sensor, url) {
    var self = this;

    var info = accessory.getService(global.Service.AccessoryInformation);

    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(global.Characteristic.Manufacturer, accessory.context.manufacturer.toString());

    accessory.context.model = sensor.productName;
    info.setCharacteristic(global.Characteristic.Model, accessory.context.model.toString());

    accessory.context.serial = sensor.serial;
    info.setCharacteristic(global.Characteristic.SerialNumber, accessory.context.serial.toString());

    this.accessory = accessory;
    this.sensor = sensor;
    this.log = log;
    this.url = url;

    this.service = accessory.getService(global.Service.SmokeSensor);
    this.service.getCharacteristic(global.Characteristic.SmokeDetected).on('get', this.getSmokeDetected.bind(this));

    accessory.updateReachability(true);
}

RademacherSmokeAlarmAccessory.prototype.getSmokeDetected = function (callback) {
    this.log("%s - Getting smoke detected", this.accessory.displayName);

    var self = this;
    var did = this.sensor.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?sensors=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.did == did)
            {
                var pos = data.position;
                callback(null, pos);
            }
        });
    });
};

RademacherSmokeAlarmAccessory.prototype.getServices = function () {
    return [this.service];
};

module.exports = RademacherSmokeAlarmAccessory;