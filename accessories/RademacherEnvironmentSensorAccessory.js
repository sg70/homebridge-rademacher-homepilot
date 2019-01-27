var request = require("request");
var tools = require("./tools.js");
var RademacherBlindsAccessory = require("./RademacherBlindsAccessory.js");

function RademacherEnvironmentSensorAccessory(log, accessory, sensor, url, inverted) {
	RademacherBlindsAccessory.call(this, log, accessory, sensor, url, inverted);

    this.meter = null;
    this.lastMeterUpdate = 0
    this.services = [this.service];
    
    // temperature sensor
    var temperatureService = this.accessory.getService(global.Service.TemperatureSensor);
    temperatureService.getCharacteristic(global.Characteristic.CurrentTemperature).on('get', this.getCurrentTemperature.bind(this));
    this.services.push(temperatureService);
    
    // light sensor
    var lightService = this.accessory.getService(global.Service.LightSensor);
    lightService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel).on('get', this.getCurrentAmbientLightLevel.bind(this));
    this.services.push(lightService);

    this.accessory.updateReachability(true);
}

RademacherEnvironmentSensorAccessory.prototype = Object.create(RademacherBlindsAccessory.prototype);

RademacherEnvironmentSensorAccessory.prototype.getMeter = function(callback) {
    if (this.lastMeterUpdate < Date.now()) {
    	var self = this;
    	request.get({
    		timeout: 2500,
    		strictSSL: false,
    		url: this.url + "/deviceajax.do?meter=" + this.did
    	}, function(e,r,b) {
    		if(e) return callback(new Error("Request failed."), false);
    		var body = JSON.parse(b);
    		var meter = body.data;
    		self.meter = meter;
    		self.lastMeterUpdate = Date.now();
    		callback(null, meter)
    	});
    } else {
    	callback(null, this.meter);
    }
};

RademacherEnvironmentSensorAccessory.prototype.getCurrentTemperature = function (callback) {
    this.log("%s - Getting current temperature", this.accessory.displayName);

    var self = this;
    this.getMeter(function(e, d) {
    	if(e) return callback(e, false);
    	d.forEach(function(pair) {
        	if(pair.hasOwnProperty("Temperatur")) {
        		var value = parseFloat(pair["Temperatur"].replace(",", "."));
            	callback(null, value);
        	}
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getCurrentAmbientLightLevel = function (callback) {
    this.log("%s - Getting current ambient light level", this.accessory.displayName);

    var self = this;
    this.getMeter(function(e, d) {
    	if(e) return callback(e, false);
    	d.forEach(function(pair) {
        	if(pair.hasOwnProperty("Lichtwert")) {
        		var value = parseFloat(pair["Lichtwert"].replace(",", "."));
            	callback(null, value);
            }
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getServices = function () {
    return this.services;
};

module.exports = RademacherEnvironmentSensorAccessory;