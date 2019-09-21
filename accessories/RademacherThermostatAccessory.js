var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherThermostatAccessory(log, accessory, thermostat, url) {
    RademacherAccessory.call(this, log, accessory, thermostat, url);
    var self = this;

    this.thermostat = thermostat;
    
    this.currentTemperature = tools.duofernTemp2HomekitTemp(this.thermostat.statusesMap.Position);
    this.lastTemperature = this.currentTemperature;
    this.targetTemperature = this.currentTemperature

    this.currentState = global.Characteristic.CurrentHeatingCoolingState.HEAT;

    this.service = this.accessory.getService(global.Service.Thermostat);

    this.service.getCharacteristic(global.Characteristic.CurrentHeatingCoolingState)
        .on('get', this.getCurrentHeatingCoolingState.bind(this));

    this.service.getCharacteristic(global.Characteristic.TargetHeatingCoolingState)
        .on('get', this.getTargetHeatingCoolingState.bind(this))
        .on('set', this.setTargetHeatingCoolingState.bind(this));

    this.service.getCharacteristic(global.Characteristic.CurrentTemperature)
        .on('get', this.getCurrentTemperature.bind(this));

    this.service.getCharacteristic(global.Characteristic.TargetTemperature)
        .on('get', this.getTargetTemperature.bind(this))
        .on('set', this.setTargetTemperature.bind(this));

    this.service.getCharacteristic(global.Characteristic.TemperatureDisplayUnits)
        .on('get', this.getTemperatureDisplayUnits.bind(this));

    this.accessory.updateReachability(true);

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherThermostatAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherThermostatAccessory.prototype.getCurrentHeatingCoolingState = function(callback) {
    this.log("%s [%s] - getting current state", this.accessory.displayName, this.thermostat.did);
    this.log("%s [%s] - current state for %s is %s", this.accessory.displayName, this.thermostat.did, this.currentState);
    callback(null, this.currentState);
};

RademacherThermostatAccessory.prototype.getCurrentTemperature = function(callback) {
    this.log("%s [%s] - getting current temperature", this.accessory.displayName, this.thermostat.did);
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d?d.statusesMap.acttemperatur/10:0;
        self.log("%s [%s] - current temperature is %d", self.accessory.displayName, self.thermostat.did,pos);
        callback(null, pos);
    });
};

RademacherThermostatAccessory.prototype.getTargetTemperature = function(callback) {
    this.log("%s [%s] - getting target temperature", this.accessory.displayName, this.thermostat.did);
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d?d.statusesMap.Position/10:0;
        self.log("%s [%s] - target temperature is %d", self.accessory.displayName, self.thermostat.did,pos);
        callback(null, pos);
    });
};

RademacherThermostatAccessory.prototype.setTargetTemperature = function(temperature, callback, context) {
    if (context) {
        this.log("%s [%s] - setting target temperature to %d", this.accessory.displayName, this.thermostat.did, temperature);
        var self = this;
        this.targetTemperature=temperature;

        var params = "{\"name\":\"TARGET_TEMPERATURE_CFG\",\"value\":"+this.targetTemperature+"}";
        request.put({
            headers: {'content-type' : 'application/json'},
            url: this.url + "/devices/"+this.thermostat.did,
            body: params
            }, function(e,r,b){
                    if(e) return callback(new Error("Request failed."), self.targetTemperature);
                    if(r.statusCode == 200)
                    {
                        return callback(null, self.targetTemperature);
                    }
                    else
                    {
                        return callback(new Error("Request failed with status "+r.statusCode), self.targetTemperature);
                    }
                });
    }
};

RademacherThermostatAccessory.prototype.getTargetHeatingCoolingState = function(callback) {
    this.log("%s - Getting target state", this.accessory.displayName);
    return callback(null, this.currentState);
};

RademacherThermostatAccessory.prototype.setTargetHeatingCoolingState = function(status, callback, context) {
    // TODO sates needed ?
    if (context) {
        this.log("%s - Setting target state to %d", this.accessory.displayName, status);
        return callback(null, this.currentState);
    }
};

RademacherThermostatAccessory.prototype.update = function() {
    this.log(`Updating %s [%s]`, this.accessory.displayName, this.thermostat.did);
    var self = this;

    // Thermostat
    this.getCurrentTemperature(function(foo, temp) {
        self.service.getCharacteristic(Characteristic.CurrentTemperature).setValue(temp, undefined, self.accessory.context);
    }.bind(this));

    this.getTargetTemperature(function(foo, temp) {
        self.service.getCharacteristic(Characteristic.TargetTemperature).setValue(temp, undefined, self.accessory.context);
    }.bind(this));

};

RademacherThermostatAccessory.prototype.getTemperatureDisplayUnits = function(callback) {
    callback(null, global.Characteristic.TemperatureDisplayUnits.CELSIUS);
};

RademacherThermostatAccessory.prototype.getServices = function() {
    return [this.service];
};

module.exports = RademacherThermostatAccessory;
