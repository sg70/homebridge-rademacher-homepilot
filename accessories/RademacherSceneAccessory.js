var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSceneAccessory(log, accessory, scene, url) {
    RademacherAccessory.call(this, log, accessory, scene, url);

    this.scene = scene;
    
    this.service = this.accessory.getService(global.Service.Switch);

    this.service
        .getCharacteristic(global.Characteristic.On)
        .setValue(false)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));
}

RademacherSceneAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSceneAccessory.prototype.getCurrentState = function(callback) {
    callback(null, false);
};

RademacherSceneAccessory.prototype.setCurrentState = function(value, callback) {
    this.log("%s [%s] - setCurrentState(%s)", this.accessory.displayName, this.scene.sid, value);

    var self = this;
    if (value)
    {
        var params = "execute="+this.scene.sid;
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: this.url + "/sceneajax.do",
            body: params
        }, function(e,r,b){
            if(e) return callback(new Error("Request failed."), false);
            if(r.statusCode == 200)
            {
                return callback(null, fasle);
            }
            else
            {
                return callback(new Error("Request failed with status "+r.statusCode), false);
            }
        });
    }
    else
    {
        return callback(null,false);
    }
};

RademacherSceneAccessory.prototype.update = function() {
    this.log(`Updating %s`, this.accessory.displayName);
    var self = this;

    // scene state
    this.getCurrentState(function(foo, state) {
        self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
    }.bind(this));
};

module.exports = RademacherSceneAccessory;
