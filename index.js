var request = require("request");
var Accessory, Service, Characteristic, UUIDGen;

var RademacherBlindsAccessory = require('./accessories/RademacherBlindsAccessory.js');
var RademacherLockAccessory = require('./accessories/RademacherLockAccessory.js');
var RademacherDimmerAccessory = require ('./accessories/RademacherDimmerAccessory.js');
var RademacherSwitchAccessory = require ('./accessories/RademacherSwitchAccessory.js');
var RademacherSmokeAlarmAccessory = require ('./accessories/RademacherSmokeAlarmAccessory.js');
var RademacherEnvironmentSensorAccessory = require ('./accessories/RademacherEnvironmentSensorAccessory.js');
var RademacherThermostatAccessory = require('./accessories/RademacherThermostatAccessory.js');
var RademacherSceneAccessory = require ('./accessories/RademacherSceneAccessory.js');

module.exports = function(homebridge) {
    global.Accessory = homebridge.platformAccessory;
    global.Service = homebridge.hap.Service;
    global.Characteristic = homebridge.hap.Characteristic;
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
                    if(data.productName.includes("RolloTron") || data.productName.includes("Troll ") ||
                       data.productName.includes("Rohrmotor") || data.productName.includes("Connect-Aktor") ||
                       data.productName.includes("RolloTube"))
                    {
                        if (accessory === undefined) {
                            self.addBlindsAccessory(data);
                        }
                        else {
                            self.log("blinds are online: %s [%s]", accessory.displayName, data.did);
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
                            self.log("dimmer is online: %s [%s]", accessory.displayName, data.did);
                            self.accessories[uuid] = new RademacherDimmerAccessory(self.log, (accessory instanceof RademacherDimmerAccessory ? accessory.accessory : accessory), data, self.url, self.inverted);
                        }
                    }
                    // thermostat
                    else if(data.productName.includes("rperstellantrieb") || data.productName.includes("Actionneur pour radiateur"))
                    {
                        if (accessory === undefined) {
                            self.addThermostatAccessory(data);
                        }
                        else {
                            self.log("thermostat is online: %s [%s]", accessory.displayName, data.did);
                            self.accessories[uuid] = new RademacherThermostatAccessory(self.log, (accessory instanceof RademacherThermostatAccessory ? accessory.accessory : accessory), data, self.url, self.inverted);
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
                                self.log("lock is online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherLockAccessory(self.log, (accessory instanceof RademacherLockAccessory ? accessory.accessory : accessory), data, self.url);
                            }
                        }
                        else {
                            if (accessory === undefined) {
                                self.addSwitchAccessory(data);
                            }
                            else
                            {
                                self.log("switch is online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherSwitchAccessory(self.log, (accessory instanceof RademacherSwitchAccessory ? accessory.accessory : accessory), data, self.url);
                            }
                        }
                    }
                    // enviroment sensor
                    else if(data.productName.includes("Umweltsensor"))
                    {
                        self.addEnvironmentSensorAccessory(accessory, data);
                    }
                    // unknown
                    else
                    {
                       self.log("Unknown product: %s",data.productName);
                    }
                });
            });
            request.get({
                timeout: 1500,
                strictSSL: false,
                url: this.url + "/deviceajax.do?sensors=1"
            }, function(e,r,b){
                if(e) return new Error("Request failed.");
                var body = JSON.parse(b);
                body.devices.forEach(function(data) {
                    var uuid = UUIDGen.generate("did"+data.did);
                    var accessory = self.accessories[uuid];
                    
                    // smoke alarm
                    if(data.productName.includes("Rauchwarnmelder"))
                    {
                        if (accessory === undefined) {
                            self.addSmokeAlarmAccessory(data);
                        }
                        else {
                            self.log("smoke alarm is online: %s [%s]", accessory.displayName, data.did);
                            self.accessories[uuid] = new RademacherSmokeAlarmAccessory(self.log, (accessory instanceof RademacherSmokeAlarmAccessory ? accessory.accessory : accessory), data, self.url);
                        }
                    }
                    else if(data.productName.includes("Umweltsensor"))
                    {
                        self.addEnvironmentSensorAccessory(accessory, data);
                    }
                    // unknown
                    else
                    {
                       self.log("Unknown product: %s",data.productName);
                    }
                });
            });
            if (config["scenes_as_switch"] && config["scenes_as_switch"]=="true") {
                request.get({
                    timeout: 1500,
                    strictSSL: false,
                    url: this.url + "/sceneajax.do?scenes=1"
                }, function(e,r,b){
                    if(e) return new Error("Request failed.");
                    var body = JSON.parse(b);
                    body.scenes.forEach(function(data) {
                        if (data.isExecutable == 1) {
                            var uuid = UUIDGen.generate("sid"+data.sid);
                            var accessory = self.accessories[uuid];

                            if (accessory === undefined) {
                                self.addSceneAccessory(data);
                            }
                            else {
                                self.log("scene is online: %s [%s]", accessory.displayName, data.sid);
                                self.accessories[uuid] = new RademacherSceneAccessory(self.log, (accessory instanceof RademacherSceneAccessory ? accessory.accessory : accessory), data, self.url);
                            }
                        }
                    });
                });
            }
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
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+blind.did));
    accessory.addService(global.Service.WindowCovering, name);
    this.accessories[accessory.UUID] = new RademacherBlindsAccessory(this.log, accessory, blind, this.url, this.inverted);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added blinds: %s - %s [%s]", blind.name, blind.description, blind.did);
};

RademacherHomePilot.prototype.addSmokeAlarmAccessory = function(sensor) {
    this.log("Found smoke alarm: %s - %s [%s]", sensor.name, sensor.description, sensor.did);

    var name = null;
    if(!sensor.description.trim())
        name = sensor.name;
    else
        name = sensor.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sensor.did));
    accessory.addService(global.Service.SmokeSensor, name);
    this.accessories[accessory.UUID] = new RademacherSmokeAlarmAccessory(this.log, accessory, sensor, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added smoke alarm: %s - %s [%s]", sensor.name, sensor.description, sensor.did);
};

RademacherHomePilot.prototype.addEnvironmentSensorAccessory = function(accessoryIn, sensor) {
    this.log("Found environment sensor: %s - %s [%s]", sensor.name, sensor.description, sensor.did);

    var name = null;
    if(!sensor.description.trim())
        name = sensor.name;
    else
        name = sensor.description;

    var accessory = null
    if (accessoryIn === undefined)
    {
        this.log("Found environment sensor: new accessory")
        accessory = new global.Accessory(name, UUIDGen.generate("did"+sensor.did));
        accessory.addService(global.Service.WindowCovering, name);
        accessory.addService(global.Service.TemperatureSensor, name);
        accessory.addService(global.Service.LightSensor, name);
        this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    }
    else if (accessoryIn instanceof RademacherEnvironmentSensorAccessory)
    {
        accessory = accessoryIn.accessory;
    }
    else
    {
        accessory = accessoryIn
    }
    if (!(this.accessories[accessory.UUID] instanceof RademacherEnvironmentSensorAccessory))
    {
        this.accessories[accessory.UUID] = new RademacherEnvironmentSensorAccessory(this.log, accessory, sensor, this.url, this.inverted);
    }
    this.log("Added environment sensor: %s - %s [%s]", sensor.name, sensor.description, sensor.did);
};

RademacherHomePilot.prototype.addDimmerAccessory = function(dimmer) {
    this.log("Found dimmer: %s - %s [%s]", dimmer.name, dimmer.description, dimmer.did);

    var name = null;
    if(!dimmer.description.trim())
        name = dimmer.name;
    else
        name = dimmer.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+dimmer.did));
    accessory.addService(global.Service.Lightbulb, name);
    this.accessories[accessory.UUID] = new RademacherDimmerAccessory(this.log, accessory, dimmer, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added dimmer: %s - %s [%s]", dimmer.name, dimmer.description, dimmer.did);
};

RademacherHomePilot.prototype.addThermostatAccessory = function(thermostat) {
    this.log("Found thermostat: %s - %s [%s]", thermostat.name, thermostat.description, thermostat.did);

    var name = null;
    if(!thermostat.description.trim())
        name = thermostat.name;
    else
        name = thermostat.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+thermostat.did));
    accessory.addService(global.Service.Thermostat, name);
    this.accessories[accessory.UUID] = new RademacherThermostatAccessory(this.log, accessory, thermostat, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added thermostat: %s - %s [%s]", thermostat.name, thermostat.description, thermostat.did);
};

RademacherHomePilot.prototype.addSwitchAccessory = function(sw) {
    this.log("Found switch: %s - %s [%s]", sw.name, sw.description, sw.did);

    var name = null;
    if(!sw.description.trim())
        name = sw.name;
    else
        name = sw.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sw.did));
    accessory.addService(global.Service.Switch, name);
    this.accessories[accessory.UUID] = new RademacherSwitchAccessory(this.log, accessory, sw, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added switch: %s - %s [%s]", sw.name, sw.description, sw.did);
};

RademacherHomePilot.prototype.addSceneAccessory = function(scene) {
    this.log("Found scene: %s - %s [%s]", scene.name, scene.description, scene.sid);

    var name = null;
    if(!scene.description.trim())
        name = scene.name;
    else
        name = scene.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("sid"+scene.sid));
    accessory.addService(global.Service.Switch, name);
    this.accessories[accessory.UUID] = new RademacherSceneAccessory(this.log, accessory, scene, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added scene: %s - %s [%s]", scene.name, scene.description, scene.sid);
};

RademacherHomePilot.prototype.addLockAccessory = function(sw) {
    this.log("Found lock: %s - %s [%s]", sw.name, sw.description, sw.did);

    var name = null;
    if(!sw.description.trim())
        name = sw.name;
    else
        name = sw.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sw.did));
    accessory.addService(global.Service.LockMechanism, name);
    this.accessories[accessory.UUID] = new RademacherLockAccessory(this.log, accessory, sw, this.url);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added lock: %s - %s [%s]", sw.name, sw.description, sw.did);
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

