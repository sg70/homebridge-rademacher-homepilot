var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherThermostatAccessory(log, debug, accessory, thermostat, session) {
    RademacherAccessory.call(this, log, debug, accessory, thermostat, session);
    var self = this;

    this.thermostat = thermostat;
    
    this.currentTemperature = tools.duofernTemp2HomekitTemp(this.thermostat.statusesMap.Position);
    this.lastTemperature = this.currentTemperature;
    this.targetTemperature = this.currentTemperature

    this.currentState = global.Characteristic.CurrentHeatingCoolingState.HEAT;

    this.service = this.accessory.getService(global.Service.Thermostat);

    this.service.getCharacteristic(global.Characteristic.CurrentHeatingCoolingState)
        .setValue(this.currentState)
        .on('get', this.getCurrentHeatingCoolingState.bind(this));

    this.service.getCharacteristic(global.Characteristic.TargetHeatingCoolingState)
        .setValue(this.currentState)
        .on('get', this.getTargetHeatingCoolingState.bind(this))
        .on('set', this.setTargetHeatingCoolingState.bind(this));

    this.service.getCharacteristic(global.Characteristic.CurrentTemperature)
        .setValue(this.currentTemperature)
        .on('get', this.getCurrentTemperature.bind(this));

    this.service.getCharacteristic(global.Characteristic.TargetTemperature)
        .setValue(self.targetTemperature)
        .on('get', this.getTargetTemperature.bind(this))
        .on('set', this.setTargetTemperature.bind(this));

    this.service.getCharacteristic(global.Characteristic.TemperatureDisplayUnits)
        .setValue(global.Characteristic.TemperatureDisplayUnits.CELSIUS)
        .on('get', this.getTemperatureDisplayUnits.bind(this));

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherThermostatAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherThermostatAccessory.prototype.getCurrentHeatingCoolingState = function(callback) {
    if (this.debug) this.log("%s [%s] - getting current state", this.accessory.displayName, this.thermostat.did);
    if (this.debug) this.log("%s [%s] - current state for %s is %s", this.accessory.displayName, this.thermostat.did, this.currentState);
    callback(null, this.currentState);
};

RademacherThermostatAccessory.prototype.getCurrentTemperature = function(callback) {
    if (this.debug) this.log("%s [%s] - getting current temperature", this.accessory.displayName, this.thermostat.did);
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d?d.statusesMap.acttemperatur/10:0;
        if (self.debug) self.log("%s [%s] - current temperature is %d", self.accessory.displayName, self.thermostat.did,pos);
        callback(null, pos);
    });
};

RademacherThermostatAccessory.prototype.getTargetTemperature = function(callback) {
    if (this.debug) this.log("%s [%s] - getting target temperature", this.accessory.displayName, this.thermostat.did);
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d?d.statusesMap.Position/10:0;
        if (self.debug) self.log("%s [%s] - target temperature is %d", self.accessory.displayName, self.thermostat.did,pos);
        callback(null, pos);
    });
};

RademacherThermostatAccessory.prototype.setTargetTemperature = function(temperature, callback, context) {
    if (context) {
        if (this.debug) this.log("%s [%s] - setting target temperature to %d", this.accessory.displayName, this.thermostat.did, temperature);
        var self = this;
        this.targetTemperature=temperature;

        var params = {name: "TARGET_TEMPERATURE_CFG", value: this.targetTemperature};
        this.session.put("/devices/"+this.thermostat.did, params, 2500, function(e) {
            if(e) return callback(new Error("Request failed: "+e), self.targetTemperature);
            return callback(null, self.targetTemperature);
        });
    }
};

RademacherThermostatAccessory.prototype.getTargetHeatingCoolingState = function(callback) {
    if (this.debug) this.log("%s - Getting target state", this.accessory.displayName);
    return callback(null, this.currentState);
};

RademacherThermostatAccessory.prototype.setTargetHeatingCoolingState = function(status, callback, context) {
    // TODO states needed ?
    if (context) {
        if (this.debug) this.log("%s - Setting target state to %d", this.accessory.displayName, status);
        return callback(null, this.currentState);
    }
};

RademacherThermostatAccessory.prototype.update = function() {
    if (this.debug) this.log(`Updating %s [%s]`, this.accessory.displayName, this.thermostat.did);
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
