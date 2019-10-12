var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherDoorSensorAccessory(log, accessory, sensor, session) {
    RademacherAccessory.call(this, log, accessory, sensor, session);

    this.sensor = sensor;

    this.service = this.accessory.getService(global.Service.ContactSensor);
    this.service.getCharacteristic(global.Characteristic.ContactSensorState)
        .setValue(this.sensor.readings.contact_state=="open"?true:false)
        .on('get', this.getCurrentDoorState.bind(this));

    this.accessory.updateReachability(true);

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
                self.service.getCharacteristic(Characteristic.ContactSensorState).setValue(closed);
                return callback(null, closed);
            }
        });
    });
};

RademacherDoorSensorAccessory.prototype.getServices = function () {
    return [this.service];
};

RademacherDoorSensorAccessory.prototype.update = function() {
    this.log(`%s - [%s] updating`, this.accessory.displayName, this.sensor.did);
    var self = this;

    // Switch state
    this.getCurrentDoorState(function(foo, state) {
        self.log(`%s [%s] - updating to is open = %s`, self.accessory.displayName, self.sensor.did, state);
        self.service.getCharacteristic(Characteristic.ContactSensorState).setValue(state, undefined, self.accessory.context);
    }.bind(this));
};

module.exports = RademacherDoorSensorAccessory;
