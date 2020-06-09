var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSunSensorAccessory(log, accessory, sensor, session) 
{
    RademacherAccessory.call(this, log, accessory, sensor, session);

    this.sensor = sensor;
    this.services = [];

    // Light sensor
    var lightSensorService = this.accessory.getService(global.Service.LightSensor);
    lightSensorService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel)
        .setProps({ minValue: 0.0001, maxValue: 100000 })
        .setValue(this.sensor.readings.sun_detected ? 100000 : 0.0001)
        .on("get", this.getCurrentSunState.bind(this));
    this.services.push(lightSensorService);

    // Switch (ambient light level characteristic of light sensor cannot yet be used as trigger in HomeKit)
    var switchService = this.accessory.getService(global.Service.Switch);
    switchService.getCharacteristic(global.Characteristic.On)
        .setValue(this.sensor.readings.sun_detected ? true : false)
        .on('get', this.getCurrentSunState.bind(this));
    this.services.push(switchService);

    setInterval(this.updateStates.bind(this), 10000);
}

RademacherSunSensorAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSunSensorAccessory.prototype.getCurrentSunState = function(callback) 
{
    this.log("%s [%s] - Getting current sun state...", this.accessory.displayName, this.sensor.did);
    var self = this;
    var did = this.did;
    this.session.get("/v4/devices?devtype=Sensor", 2500, function (e, body) {
        if (e) return callback(new Error("Request failed: " + e), false);
        body.meters.forEach(function (data) {
            if (data.did == did) {
                var t = data.readings.sun_detected;
                self.log("%s [%s] - sun_detected=%s", self.accessory.displayName, self.sensor.did, t);
                callback(null, t);
            }
        });
    });
};

RademacherSunSensorAccessory.prototype.updateStates = function() {
    this.getCurrentSunState(function(foo, sun_detected) {
        // Update LightSensor state
        var lightSensorService = this.accessory.getService(global.Service.LightSensor);
        lightSensorService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel)
            .setValue(sun_detected ? 100000 : 0.0001, undefined, this.accessory.context);
        // Update Switch state
        var switchService = this.accessory.getService(global.Service.Switch);
        switchService.getCharacteristic(global.Characteristic.On)
            .setValue(sun_detected ? true : false);
    }.bind(this));
};

RademacherSunSensorAccessory.prototype.getServices = function() 
{
    return this.services;
};

module.exports = RademacherSunSensorAccessory;
