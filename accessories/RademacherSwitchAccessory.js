var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSwitchAccessory(log, accessory, sw, url) {
    RademacherAccessory.call(this, log, accessory, sw, url);

    this.sw = sw;
    this.lastState = this.sw.position==100?true:false;
    this.currentState = this.sw.position==100?true:false;

    this.service = this.accessory.getService(global.Service.Switch);

    this.service
        .getCharacteristic(global.Characteristic.On)
        .setValue(this.sw.position==100?true:false)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));

    this.accessory.updateReachability(true);

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherSwitchAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSwitchAccessory.prototype.getCurrentState = function(callback) {
    this.log("%s - Getting current state for %s", this.accessory.displayName, this.accessory.UUID);

    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.position;
        callback(null, (pos==100?true:false));
    });
};

RademacherSwitchAccessory.prototype.setCurrentState = function(value, callback) {
    this.log("%s - Setting switch: %s", this.accessory.displayName, value);

    var self = this;
    this.currentState = value;
    var changed = (this.currentState != this.lastState);
    this.log("%s - switch changed=%s", this.accessory.displayName, changed);
    if (changed)
    {
    var params = "cid="+(this.currentState?"10":"11")+"&did="+this.did+"&command=1";
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: this.url + "/deviceajax.do",
        body: params
    }, function(e,r,b){
            if(e) return callback(new Error("Request failed."), self.currentState);
            if(r.statusCode == 200)
            {
                self.lastState = self.currentState;
                return callback(null, self.currentState);
            }
            else
            {
                return callback(new Error("Request failed with status "+r.statusCode), self.currentState);
            }
        });
    }
    else
    {
        return callback(null,this.currentState);
    }
};

RademacherSwitchAccessory.prototype.update = function() {
    this.log(`Updating %s`, this.accessory.displayName);
    var self = this;

    // Switch state
    this.getCurrentState(function(foo, state) {
        self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
    }.bind(this));
};

module.exports = RademacherSwitchAccessory;