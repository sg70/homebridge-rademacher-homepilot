var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSmokeAlarmAccessory(log, debug, accessory, sensor, session) {
    RademacherAccessory.call(this, log, debug, accessory, sensor, session);

    this.sensor = sensor;
    this.services = [];

    var smokesensorService = this.accessory.getService(global.Service.SmokeSensor);
    smokesensorService.getCharacteristic(global.Characteristic.SmokeDetected)
        .on('get', this.getSmokeDetected.bind(this));
    this.services.push(smokesensorService);

            // battery
    var batteryService = this.accessory.getService(global.Service.BatteryService);
    batteryService.getCharacteristic(global.Characteristic.BatteryLevel)
        .on('get', this.getCurrentBatteryLevel.bind(this));
    this.services.push(batteryService);

    // TODO configure interval
    setInterval(this.update.bind(this), 10000);

}

RademacherSmokeAlarmAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSmokeAlarmAccessory.prototype.getSmokeDetected = function (callback) {
    if (this.debug) this.log("%s [%s] - getting smoke detected", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;

    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                var sd=data.readings.smoke_detected
                if (self.debug) self.log("%s [%s] - smoke detected=%s", self.accessory.displayName, self.sensor.did, sd);
                var pos = sd?100:0;
                callback(null, pos);
            }
        });
    });
};

RademacherSmokeAlarmAccessory.prototype.getCurrentBatteryLevel = function (callback) {
    if (this.debug) this.log("%s [%s] - getting current battery level", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;

    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                if (self.debug) self.log(data.readings);
                var batteryStatus=data.batteryStatus;
                if (self.debug) self.log("%s [%s] - battery status = %s", self.accessory.displayName, self.sensor.did, batteryStatus);
                return callback(null, batteryStatus);
            }
        });
    });
};

RademacherSmokeAlarmAccessory.prototype.getServices = function () {
    return this.service;
};

RademacherSmokeAlarmAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s - [%s] updating`, this.accessory.displayName, this.sensor.did);
    var self = this;

    // Switch state
    this.getSmokeDetected(function(foo, state) {
        if (self.debug) self.log(`%s [%s] - smoke detected = %s`, self.accessory.displayName, self.sensor.did, state);
        var smokesensorService = this.accessory.getService(global.Service.SmokeSensor);
        smokesensorService.getCharacteristic(global.Characteristic.SmokeDetected).setValue(state, undefined, self.accessory.context);
    }.bind(this));

    // battery level
    this.getCurrentBatteryLevel(function(foo, level) {
        if (self.debug) self.log(`%s [%s] - updating battery level to %s`, self.accessory.displayName, self.sensor.did, level);
        var batteryService = this.accessory.getService(global.Service.BatteryService);
        batteryService.getCharacteristic(Characteristic.BatteryLevel).setValue(level, undefined, self.accessory.context);
    }.bind(this));

};

module.exports = RademacherSmokeAlarmAccessory;