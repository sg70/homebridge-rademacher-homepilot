var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherThermostatAccessory(log, accessory, thermostat, url) {
    RademacherAccessory.call(this, log, accessory, thermostat, url);
    var self = this;

    this.thermostat = thermostat;
    
    this.currentTemperature = tools.duofernTemp2HomekitTemp(this.thermostat.position);
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
    this.log("%s - Getting current state for %s", this.accessory.displayName, this.accessory.UUID);
    this.log("%s - current state for %s is %s", this.accessory.displayName, this.accessory.UUID, this.currentState);
    callback(null, this.currentState);
};

RademacherThermostatAccessory.prototype.getCurrentTemperature = function(callback) {
    this.log("%s - Getting current temperature for %s", this.accessory.displayName, this.accessory.UUID);
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.position/10;
        self.log("%s - current temperature for %s is %d", self.accessory.displayName, self.accessory.UUID,pos);
        callback(null, pos);
    });
};

RademacherThermostatAccessory.prototype.getTargetTemperature = function(callback) {
    this.log("%s - Getting target temperature for %s", this.accessory.displayName, this.accessory.UUID);
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.position/10;
        self.log("%s - target temperature for %s is %d", self.accessory.displayName, self.accessory.UUID,pos);
        callback(null, pos);
    });
};

RademacherThermostatAccessory.prototype.setTargetTemperature = function(temperature, callback, context) {
    if (context) {
        this.log("%s - Setting target temperature to %d", this.accessory.displayName, temperature);

        var self = this;
        this.targetTemperature=temperature;
        var params = "cid=9&did="+this.thermostat.did+"&command=1&goto="+tools.homekitTemp2DuofernTemp(this.targetTemperature);
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: this.url + "/deviceajax.do",
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
    this.log(`Updating %s`, this.accessory.displayName);
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
