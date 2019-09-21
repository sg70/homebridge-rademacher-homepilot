var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSmokeAlarmAccessory(log, accessory, sensor, url) {
    RademacherAccessory.call(this, log, accessory, sensor, url);

    this.sensor = sensor;

    this.service = this.accessory.getService(global.Service.SmokeSensor);
    this.service.getCharacteristic(global.Characteristic.SmokeDetected)
        .on('get', this.getSmokeDetected.bind(this));

    this.accessory.updateReachability(true);
}

RademacherSmokeAlarmAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSmokeAlarmAccessory.prototype.getSmokeDetected = function (callback) {
    this.log("%s [%s] - getting smoke detected", this.accessory.displayName, this.sensor.did);

    var self = this;
    var did = this.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/v4/devices?devtype=Sensor"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.meters.forEach(function(data) {
            if(data.did == did)
            {
                var sd=data.readings.smoke_detected
                self.log("%s [%s] - smoke detected=%s", self.accessory.displayName, self.sensor.did, sd);
                var pos = sd?100:0;
                callback(null, pos);
            }
        });
    });
};

RademacherSmokeAlarmAccessory.prototype.getServices = function () {
    return [this.service];
};

module.exports = RademacherSmokeAlarmAccessory;