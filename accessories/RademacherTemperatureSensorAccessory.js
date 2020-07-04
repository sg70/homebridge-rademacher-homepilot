var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherTemperatureSensorAccessory(log, debug, accessory, sensor, session) {
    RademacherAccessory.call(this, log, debug, accessory, sensor, session);

    this.sensor = sensor;

    this.service = this.accessory.getService(global.Service.TemperatureSensor);
    this.service.getCharacteristic(global.Characteristic.CurrentTemperature)
        .setProps({minValue: -30.0, maxValue: 80.0})
        .setValue(sensor.readings.temperature_primary)
        .on('get', this.getCurrentTemperature.bind(this));
}

RademacherTemperatureSensorAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherTemperatureSensorAccessory.prototype.getCurrentTemperature = function (callback) {
    if (this.debug) this.log("%s [%s] - getting current temperature", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;

    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                var t = data.readings.temperature_primary;
                if (self.debug) self.log("%s [%s] - temperature is %s", self.accessory.displayName, self.sensor.did, t);
                callback(null, t);
            }
        });
    });
};

RademacherTemperatureSensorAccessory.prototype.getServices = function () {
    return [this.service];
};

module.exports = RademacherTemperatureSensorAccessory;
