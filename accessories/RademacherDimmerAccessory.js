
var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherDimmerAccessory(log, accessory, dimmer, url) {
    RademacherAccessory.call(this, log, accessory, dimmer, url);
    var self = this;

    this.dimmer = dimmer;
    this.lastBrightness = this.dimmer.brightness;
    this.currentBrightness = 2;
    this.currentStatus = 100;

    this.service = this.accessory.getService(global.Service.Lightbulb);

    this.service.getCharacteristic(global.Characteristic.On)
        .on('get', this.getStatus.bind(this))
        .on('set', this.setStatus.bind(this));

    this.service.getCharacteristic(global.Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));

    this.accessory.updateReachability(true);

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherDimmerAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherDimmerAccessory.prototype.getStatus = function(callback) {
    this.log("%s - Getting current state for %s", this.accessory.displayName, this.accessory.UUID);

    var self = this;

    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.statusesMap.Position;
        callback(null, (pos>0?true:false));
    });
};

RademacherDimmerAccessory.prototype.setStatus = function(status, callback, context) {
    if (context) {
        this.on = status;
        this.log("%s - Setting dimmer: %s", this.accessory.displayName, status);

        var self = this;
        this.currentState = status;
        var changed = (this.currentState != this.lastState);
        this.log("%s - dimmer changed=%s", this.accessory.displayName, changed);
        if (changed)
        {            
            callback(null, self.currentState);
            return; //TODO
            var params = "cid="+(this.currentState?"10":"11")+"&did="+this.dimmer.did+"&command=1";
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
    }
};

RademacherDimmerAccessory.prototype.getBrightness = function(callback) {
    this.log("%s - Getting current brightness", this.accessory.displayName);

    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, false);
        var pos = d.statusesMap.Position;
        callback(null, pos);
    });
};

RademacherDimmerAccessory.prototype.setBrightness = function(brightness, callback, context) {
    if (context) {
        this.log("%s - Setting target brightness: %s", this.accessory.displayName, brightness);
        var self = this;
        this.currentBrightness = brightness;
        var moveUp = (this.currentBrightness >= this.lastBrightness);
        this.service.setCharacteristic(Characteristic.Brightness, (moveUp ? 1 : 0));
        var target = brightness;

        callback(null, self.currentState);
        return; //TODO

        var params = "cid=9&did="+this.dimmer.did+"&command=1&goto="+ target;
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: this.url + "/deviceajax.do",
            body: params
        }, function(e,r,b){
            if(e) return callback(new Error("Request failed."), false);
            if(r.statusCode == 200)
            {
                self.service.setCharacteristic(Characteristic.Brightness, self.currentBrightness);
                self.lastBrightness = self.currentBrightness;
                callback(null, self.currentBrightness);
            }
        });
    }
};

RademacherDimmerAccessory.prototype.update = function() {
    this.log(`Updating %s`, this.accessory.displayName);
    var self = this;

    // Status
    this.getStatus(function(foo, state) {
        self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
    }.bind(this));

    // Brightness
    this.getBrightness(function(foo, brightness) {
        self.service.getCharacteristic(Characteristic.Brightness).setValue(brightness, undefined, self.accessory.context);
    }.bind(this));


};

RademacherDimmerAccessory.prototype.getServices = function() {
    return [this.service];
};

module.exports = RademacherDimmerAccessory;
