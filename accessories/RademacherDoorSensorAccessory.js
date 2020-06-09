var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherDoorSensorAccessory(log, accessory, sensor, session) {
    RademacherAccessory.call(this, log, accessory, sensor, session);

    this.sensor = sensor;
    this.services = [];

    // contactsensor

    var contactsensorService = this.accessory.getService(global.Service.ContactSensor);
    contactsensorService.getCharacteristic(global.Characteristic.ContactSensorState)
        .setValue(this.sensor.readings.contact_state=="open"?true:false)
        .on('get', this.getCurrentDoorState.bind(this));
    this.services.push(contactsensorService);

    // battery
    var batteryService = this.accessory.getService(global.Service.BatteryService);
    batteryService.getCharacteristic(global.Characteristic.BatteryLevel)
        .on('get', this.getCurrentBatteryLevel.bind(this));
    this.services.push(batteryService);


    // TODO configure interval
    setInterval(this.update.bind(this), 10000);

}

RademacherDoorSensorAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherDoorSensorAccessory.prototype.getCurrentDoorState = function (callback) {
    this.log("%s [%s] - getting current door state", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;

    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                self.log(data.readings);
                var contact_state=data.readings.contact_state;
                var closed=contact_state=="open";
                self.log("%s [%s] - door is open = %s", self.accessory.displayName, self.sensor.did, closed);
                return callback(null, closed);
            }
        });
    });
};

RademacherDoorSensorAccessory.prototype.getCurrentBatteryLevel = function (callback) {
    this.log("%s [%s] - getting current battery level", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;

    this.session.get("/v4/devices?devtype=Sensor", 2500, function(e, body) {
        if(e) return callback(new Error("Request failed: "+e), false);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                self.log(data.readings);
                var batteryStatus=data.batteryStatus;
                self.log("%s [%s] - battery status = %s", self.accessory.displayName, self.sensor.did, batteryStatus);
                return callback(null, batteryStatus);
            }
        });
    });
};


RademacherDoorSensorAccessory.prototype.getServices = function () {
    return this.services;
};

RademacherDoorSensorAccessory.prototype.update = function() {
    this.log(`%s - [%s] updating`, this.accessory.displayName, this.sensor.did);
    var self = this;

    // Switch state
    this.getCurrentDoorState(function(foo, state) {
        self.log(`%s [%s] - updating to is open = %s`, self.accessory.displayName, self.sensor.did, state);
        var contactsensorService = self.accessory.getService(global.Service.ContactSensor);
        contactsensorService.getCharacteristic(Characteristic.ContactSensorState).setValue(state, undefined, self.accessory.context);
    }.bind(this));

    // battery level
    this.getCurrentBatteryLevel(function(foo, level) {
        self.log(`%s [%s] - updating battery level to %s`, self.accessory.displayName, self.sensor.did, level);
        var batteryService = this.accessory.getService(global.Service.BatteryService);
        batteryService.getCharacteristic(Characteristic.BatteryLevel).setValue(level, undefined, self.accessory.context);
    }.bind(this));

};

module.exports = RademacherDoorSensorAccessory;
