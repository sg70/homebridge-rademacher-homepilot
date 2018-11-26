var request = require("request");
var Accessory, Service, Characteristic, UUIDGen;

var RademacherBlindsAccessory = require('./accessories/RademacherBlindsAccessory.js');
var RademacherLockAccessory = require('./accessories/RademacherLockAccessory.js');
var RademacherDimmerAccessory = require ('./accessories/RademacherDimmerAccessory.js');
var RademacherSwitchAccessory = require ('./accessories/RademacherSwitchAccessory.js');

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
    this.accessories[accessory.UUID] = new RademacherDimmerAccessory(this.log, accessory, dimmer, this.url, this.inverted);
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

function reversePercentage(p) {
    var min = 0;
    var max = 100;
    return (min + max) - p;
}
