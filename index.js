var request = require("request");
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-rademacher-homepilot", "RademacherHomePilot", RademacherHomePilot, true);
};

function RademacherHomePilot(log, config, api) {
    // global vars
    this.log = log;

    var self = this;

    // configuration vars
    this.url = config["url"];
    this.accessories = [];
    this.inverted = true;

    if (api) {
        this.api = api;

        this.api.on('didFinishLaunching', function() {
            request.get({
                timeout: 1500,
                strictSSL: false,
                url: this.url + "/deviceajax.do?devices=1"
            }, function(e,r,b){
                if(e) return new Error("Request failed.");
                var body = JSON.parse(b);
                body.devices.forEach(function(data) {
                    var uuid = UUIDGen.generate("did"+data.did);
                    var accessory = self.accessories[uuid];
                    
                    // blinds
                    if(data.productName.includes("RolloTron") || data.productName.includes("Troll Comfort") ||
                       data.productName.includes("Rohrmotor") || data.productName.includes("Connect-Aktor") ||
                       data.productName.includes("RolloTube"))
                    {
                        if (accessory === undefined) {
                            self.addBlindsAccessory(data);
                        }
                        else {
                            self.log("Online: %s [%s]", accessory.displayName, data.did);
                            self.accessories[uuid] = new RademacherBlindsAccessory(self.log, (accessory instanceof RademacherBlindsAccessory ? accessory.accessory : accessory), data, self.url, self.inverted);
                        }
                    }
                    // dimmer
                    else if(data.productName.includes("Universaldimmer"))
                    {
                        if (accessory === undefined) {
                            self.addDimmerAccessory(data);
                        }
                        else {
                            self.log("Online: %s [%s]", accessory.displayName, data.did);
                            self.accessories[uuid] = new RademacherDimmerAccessory(self.log, (accessory instanceof RademacherDimmerAccessory ? accessory.accessory : accessory), data, self.url, self.inverted);
                        }
                    }
                    // lock/switch
                    else if(data.productName.includes("Schaltaktor") || data.productName.includes("Universal-Aktor"))
                    {
                        if (data.iconSet.name.includes("tor")){
                            if (accessory === undefined) {
                                self.addLockAccessory(data);
                            }
                            else
                            { 
                                self.log("Online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherLockAccessory(self.log, (accessory instanceof RademacherLockAccessory ? accessory.accessory : accessory), data, self.url);
                            }
                        }
                        else {
                            if (accessory === undefined) {
                                self.addSwitchAccessory(data);
                            }
                            else
                            {
                                self.log("Online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherSwitchAccessory(self.log, (accessory instanceof RademacherSwitchAccessory ? accessory.accessory : accessory), data, self.url);
                            }
                        }
                    }
                    // unknown
                    else
                    {
                       self.log("Unknown product: %s",data.productName);
                    }
                });
            });
        }.bind(this));
    }
}

RademacherHomePilot.prototype.configureAccessory = function(accessory) {
    this.accessories[accessory.UUID] = accessory;
};

RademacherHomePilot.prototype.addBlindsAccessory = function(blind) {
    this.log("Found blinds: %s - %s [%s]", blind.name, blind.description, blind.did);

    var name = null;
    if(!blind.description.trim())
        name = blind.name;
    else
        name = blind.description;
    var accessory = new Accessory(name, UUIDGen.generate("did"+blind.did));
    accessory.addService(Service.WindowCovering, name);
    this.accessories[accessory.UUID] = new RademacherBlindsAccessory(this.log, accessory, blind, this.url, this.inverted);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
};

RademacherHomePilot.prototype.addDimmerAccessory = function(dimmer) {
    this.log("Found dimmer: %s - %s [%s]", dimmer.name, dimmer.description, dimmer.did);

    var name = null;
    if(!dimmer.description.trim())
        name = dimmer.name;
    else
        name = dimmer.description;
    var accessory = new Accessory(name, UUIDGen.generate("did"+dimmer.did));
    accessory.addService(Service.Lightbulb, name);
    this.accessories[accessory.UUID] = new RademacheDimmerAccessory(this.log, accessory, dimmer, this.url, this.inverted);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
};

RademacherHomePilot.prototype.addSwitchAccessory = function(sw) {
    this.log("Found switch: %s - %s [%s]", sw.name, sw.description, sw.did);

    var name = null;
    if(!sw.description.trim())
        name = sw.name;
    else
        name = sw.description;
    var accessory = new Accessory(name, UUIDGen.generate("did"+sw.did));
    accessory.addService(Service.Switch, name);
    this.accessories[accessory.UUID] = new RademacherSwitchAccessory(this.log, accessory, sw, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
};

RademacherHomePilot.prototype.addLockAccessory = function(sw) {
    this.log("Found lock: %s - %s [%s]", sw.name, sw.description, sw.did);

    var name = null;
    if(!sw.description.trim())
        name = sw.name;
    else
        name = sw.description;
    var accessory = new Accessory(name, UUIDGen.generate("did"+sw.did));
    accessory.addService(Service.LockMechanism, name);
    this.accessories[accessory.UUID] = new RademacherLockAccessory(this.log, accessory, sw, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
};

RademacherHomePilot.prototype.removeAccessory = function(accessory) {
    if (accessory) {
        this.log("[" + accessory.description + "] Removed from HomeBridge.");
        if (this.accessories[accessory.UUID]) {
            delete this.accessories[accessory.UUID];
        }
        this.api.unregisterPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    }
};

function RademacherBlindsAccessory(log, accessory, blind, url, inverted) {
    var self = this;

    var info = accessory.getService(Service.AccessoryInformation);

    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer.toString());

    accessory.context.model = blind.productName;
    info.setCharacteristic(Characteristic.Model, accessory.context.model.toString());

    accessory.context.serial = blind.serial;
    info.setCharacteristic(Characteristic.SerialNumber, accessory.context.serial.toString());

    this.inverted = inverted;
    this.accessory = accessory;
    this.blind = blind;
    this.log = log;
    this.url = url;
    this.lastPosition = this.inverted ? reversePercentage(this.blind.position) : this.blind.position;
    this.currentPositionState = 2;
    this.currentTargetPosition = 100;

    this.service = accessory.getService(Service.WindowCovering);

    this.service
        .getCharacteristic(Characteristic.CurrentPosition)
        .setValue(self.inverted ? reversePercentage(self.blind.position) : self.blind.position)
        .on('get', this.getCurrentPosition.bind(this));

    this.service
        .getCharacteristic(Characteristic.TargetPosition)
        .setValue(self.inverted ? reversePercentage(self.blind.position) : self.blind.position)
        .on('get', this.getTargetPosition.bind(this))
        .on('set', this.setTargetPosition.bind(this));

    this.service.getCharacteristic(Characteristic.PositionState)
        .setValue(this.currentPositionState)
        .on('get', this.getPositionState.bind(this));

    accessory.updateReachability(true);
}

RademacherBlindsAccessory.prototype.setTargetPosition = function(value, callback) {
    this.log("%s - Setting target position: %s", this.accessory.displayName, value);

    var self = this;
    this.currentTargetPosition = value;
    var moveUp = (this.currentTargetPosition >= this.lastPosition);
    this.service.setCharacteristic(Characteristic.PositionState, (moveUp ? 1 : 0));
    var target = self.inverted ? reversePercentage(value) : value;

    var params = "cid=9&did="+this.blind.did+"&command=1&goto="+ target;
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: this.url + "/deviceajax.do",
        body: params
    }, function(e,r,b){
        if(e) return callback(new Error("Request failed."), false);
        if(r.statusCode == 200)
        {
            self.service.setCharacteristic(Characteristic.CurrentPosition, self.currentTargetPosition);
            self.service.setCharacteristic(Characteristic.PositionState, 2);
            self.lastPosition = self.currentTargetPosition;
            callback(null, self.currentTargetPosition);
        }
    });
};

RademacherBlindsAccessory.prototype.getTargetPosition = function(callback) {
    this.log("%s - Getting target position", this.accessory.displayName);

    var self = this;
    var did = this.blind.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed."), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.did == did)
            {
                var pos = self.inverted ? reversePercentage(data.position) : data.position;
                self.currentTargetPosition = pos;
                callback(null, pos);
            }
        });
    });
};

RademacherBlindsAccessory.prototype.getCurrentPosition = function(callback) {
    this.log("%s - Getting current position", this.accessory.displayName);

    var self = this;
    var did = this.blind.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.did == did)
            {
                var pos = self.inverted ? reversePercentage(data.position) : data.position;
                callback(null, pos);
            }
        });
    });
};

RademacherBlindsAccessory.prototype.getPositionState = function(callback) {
    callback(null, this.currentPositionState);
};

function RademacherSwitchAccessory(log, accessory, sw, url) {
    var self = this;

    var info = accessory.getService(Service.AccessoryInformation);

    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer.toString());

    accessory.context.model = sw.productName;
    info.setCharacteristic(Characteristic.Model, accessory.context.model.toString());

    accessory.context.serial = sw.serial;
    info.setCharacteristic(Characteristic.SerialNumber, accessory.context.serial.toString());

    this.accessory = accessory;
    this.sw = sw;
    this.log = log;
    this.url = url;
    this.lastState = this.sw.position==100?true:false;
    this.currentState = this.sw.position==100?true:false;

    this.service = accessory.getService(Service.Switch);

    this.service
        .getCharacteristic(Characteristic.On)
        .setValue(self.sw.position==100?true:false)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));

    accessory.updateReachability(true);
}

RademacherSwitchAccessory.prototype.getCurrentState = function(callback) {
    this.log("%s - Getting current state for %s", this.accessory.displayName, this.accessory.UUID);

    var self = this;
    var serial = this.sw.serial;
    var name = this.sw.name;

    request.get({
        timeout: 1500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.serial == serial && data.name == name)
            {
                var pos = data.position;
                callback(null, (pos==100?true:false));
            }
        });
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
       var params = "cid="+(this.currentState?"10":"11")+"&did="+this.sw.did+"&command=1";
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

function RademacherLockAccessory(log, accessory, sw, url) {
  this.log = log;
  this.sw = sw;
  this.url = url;
  this.accessory = accessory;
  this.lockservice = accessory.getService(Service.LockMechanism);
  
  this.lockservice
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));
  
  this.lockservice
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
	
}

RademacherLockAccessory.prototype.getState = function(callback) {
    this.log("Get lock state of %s", this.accessory.displayName)
    callback(null, true);
}

RademacherLockAccessory.prototype.setState = function(state, callback) {
    var self=this;
    var lockState = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";
    this.log("Set lock state of %s to %s", this.accessory.displayName,lockState);

    var params = "cid=10&did="+this.sw.did+"&command=1";
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: this.url + "/deviceajax.do",
        body: params
        }, function(e,r,b){
            if(e) return callback(new Error("Request failed."), false);
            if(r.statusCode == 200)
            {
                // alway unlock
                self.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
                self.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
                callback(null);
            }
    });
}


RademacherLockAccessory.prototype.getServices = function() {
  return [this.lockservice];
}

function RademacherDimmerAccessory(log, accessory, dimmer, url, inverted) {
    var self = this;

    var info = accessory.getService(Service.AccessoryInformation);

    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer.toString());

    accessory.context.model = dimmer.productName;
    info.setCharacteristic(Characteristic.Model, accessory.context.model.toString());

    accessory.context.serial = dimmer.serial;
    info.setCharacteristic(Characteristic.SerialNumber, accessory.context.serial.toString());

    this.inverted = inverted;
    this.accessory = accessory;
    this.dimmer = dimmer;
    this.log = log;
    this.url = url;
    this.lastBrightness = this.inverted ? reversePercentage(this.dimmer.brightness) : this.dimmer.brightness;
    this.currentBrightness = 2;
    this.currentStatus = 100;

    this.service = accessory.getService(Service.Lightbulb);

    this.service.getCharacteristic(Characteristic.On)
        .on('get', this.getStatus.bind(this))
        .on('set', this.setStatus.bind(this));

    this.service.getCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));

    accessory.updateReachability(true);
}

RademacherDimmerAccessory.prototype.isInt = function (value) {
    return /^-?[0-9]+$/.test(value);
};

RademacherDimmerAccessory.prototype.getStatus = function (callback) {
    this.log("%s - Getting current state for %s", this.accessory.displayName, this.accessory.UUID);

    var self = this;
    var serial = this.sw.serial;
    var name = this.sw.name;

    request.get({
        timeout: 1500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.serial == serial && data.name == name)
            {
                var pos = data.position;
                callback(null, (pos>0?true:false));
            }
        });
    });
};

RademacherDimmerAccessory.prototype.setStatus = function (status, callback, context) {
    if (context !== 'fromSetValue') {
        this.on = status;
        this.log("%s - Setting switch: %s", this.accessory.displayName, value);

        var self = this;
        this.currentState = value;
        var changed = (this.currentState != this.lastState);
        this.log("%s - switch changed=%s", this.accessory.displayName, changed);
        if (changed)
        {
           var params = "cid="+(this.currentState?"10":"11")+"&did="+this.sw.did+"&command=1";
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

RademacherDimmerAccessory.prototype.getBrightness = function (callback) {
    this.log("%s - Getting current brightness", this.accessory.displayName);

    var self = this;
    var did = this.dimmer.did;

    request.get({
        timeout: 2500,
        strictSSL: false,
        url: this.url + "/deviceajax.do?devices=1"
    }, function(e,r,b) {
        if(e) return callback(new Error("Request failed: "+e), false);
        var body = JSON.parse(b);
        body.devices.forEach(function(data) {
            if(data.did == did)
            {
                var pos = self.inverted ? reversePercentage(data.position) : data.position;
                callback(null, pos);
            }
        });
    });
};

RademacherDimmerAccessory.prototype.setBrightness = function (brightness, callback, context) {
    if (context !== 'fromSetValue') {
        this.log("%s - Setting target position: %s", this.accessory.displayName, value);
        var self = this;
        this.currentBrightness = brightness;
        var moveUp = (this.currentBrightness >= this.lastBrightness);
        this.service.setCharacteristic(Characteristic.Brightness, (moveUp ? 1 : 0));
        var target = self.inverted ? reversePercentage(brightness) : brightness;
    
        var params = "cid=9&did="+this.blind.did+"&command=1&goto="+ target;
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

RademacherDimmerAccessory.prototype.getServices = function () {
    return [this.service];
};

function reversePercentage(p) {
    var min = 0;
    var max = 100;
    return (min + max) - p;
}
