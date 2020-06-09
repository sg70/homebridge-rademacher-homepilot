var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSceneAccessory(log, accessory, scene, session) {
    RademacherAccessory.call(this, log, accessory, scene, session);

    this.scene = scene;

    this.service = this.accessory.getService(global.Service.Switch);

    this.service
        .getCharacteristic(global.Characteristic.On).setValue(false)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));
}

RademacherSceneAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSceneAccessory.prototype.getScene = function(callback) {
    if (this.lastUpdate < Date.now()) {
        var self = this;
        this.session.get("/v4/scenes/" + this.scene.sid, 5000, function(e, body) {
    		if(e) return callback(new Error("Request failed: "+e), false);
            if (body.hasOwnProperty("scene"))
            {
                self.scene = body.scene;
                self.lastUpdate = Date.now();
                callback(null, self.scene)    
            }
            else
            {
                self.log('no scene');
                callback(null, self.scene);
            }
    	});
    } else {
    	callback(null, this.scene);
    }
};


RademacherSceneAccessory.prototype.getCurrentState = function(callback) {
    callback(null, false);
};

RademacherSceneAccessory.prototype.setCurrentState = function(value, callback) {
    this.log("%s [%s] - setCurrentState(%s)", this.accessory.displayName, this.scene.sid,value);
    var self = this;
    if (value)
    {
        var params = {request_type:"EXECUTESCENE",trigger_event:"TRIGGER_SCENE_MANUALLY_EVT"}
        this.log(`%s - [%s] executing scene`, this.accessory.displayName, this.scene.sid);
        this.session.post("/scenes/"+this.scene.sid+"/actions", params, 2500, function (e) {
            if(e) self.log(e)
            setTimeout(self.update.bind(self), 2000);
        });
    }
    return callback(null, false);
};

RademacherSceneAccessory.prototype.update = function() {
    var self = this;

    // Switch state
    this.getCurrentState(function(foo, state) {
        self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
    }.bind(this));
};

module.exports = RademacherSceneAccessory;