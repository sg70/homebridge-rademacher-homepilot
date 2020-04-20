var tools = require("./tools.js");
var RademacherBlindsAccessory = require("./RademacherBlindsAccessory.js");

function RademacherEnvironmentSensorAccessory(log, accessory, sensor, session, inverted) {
	RademacherBlindsAccessory.call(this, log, accessory, sensor, session, inverted);

    this.sensor = sensor;
    this.services = [this.service];
    
    // temperature sensor
    var temperatureService = this.accessory.getService(global.Service.TemperatureSensor);
    temperatureService.getCharacteristic(global.Characteristic.CurrentTemperature)
		.setProps({minValue: -30.0, maxValue: 80.0})
		.on('get', this.getCurrentTemperature.bind(this));
    this.services.push(temperatureService);
    
    // light sensor
    var lightService = this.accessory.getService(global.Service.LightSensor);
    lightService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel)
		.setProps({minValue: 0, maxValue: 150000})
		.on('get', this.getCurrentAmbientLightLevel.bind(this));
    this.services.push(lightService);

    this.accessory.updateReachability(true);
}

RademacherEnvironmentSensorAccessory.prototype = Object.create(RademacherBlindsAccessory.prototype);

RademacherEnvironmentSensorAccessory.prototype.getCurrentTemperature = function (callback) {
    this.log("%s [%s] - Getting current temperature", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;
    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                var t = data.readings.temperature_primary;
                self.log("%s [%s] - temperature is %s", self.accessory.displayName, self.sensor.did, t);
                callback(null, t);
            }
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getCurrentAmbientLightLevel = function (callback) {
    this.log("%s [%s] - Getting current ambient light level", this.accessory.displayName, this.sensor.did);
    var self = this;
    var did = this.did;
    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                var t = data.readings.sun_brightness;
                self.log("%s [%s] - sun_brightness is %s", self.accessory.displayName, self.sensor.did, t);
                callback(null, t);
            }
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getServices = function () {
    return this.services;
};

module.exports = RademacherEnvironmentSensorAccessory;