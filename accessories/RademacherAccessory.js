var request = require("request");

function RademacherAccessory(log, accessory, data, url) {
    var info = accessory.getService(global.Service.AccessoryInformation);
    
    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(global.Characteristic.Manufacturer, accessory.context.manufacturer.toString());
    
    accessory.context.model = ""
    if (data.productName) {
        accessory.context.model = data.productName;
    } else if (data.name) {
        accessory.context.model = data.name;
    }
    info.setCharacteristic(global.Characteristic.Model, accessory.context.model.toString());
    
    if (data.uid) {
        accessory.context.serial = data.uid;
    }
    else if (data.sid) {
        accessory.context.serial = data.sid;
    }
    info.setCharacteristic(global.Characteristic.SerialNumber, accessory.context.serial.toString());
    
    if (data.version) {
        accessory.context.revision = data.version;
        info.setCharacteristic(global.Characteristic.FirmwareRevision, accessory.context.revision.toString());
    }
    
    this.accessory = accessory;
    this.log = log;
    this.url = url;
    this.did = data.did;
    this.lastUpdate = 0;
    this.device = null;
}

RademacherAccessory.prototype.getDevice = function(callback) {
    if (this.lastUpdate < Date.now()) {
    	var self = this;
    	request.get({
    		timeout: 2500,
    		strictSSL: false,
    		url: this.url + "/deviceajax.do?device=" + this.did
    	}, function(e,r,b) {
    		if(e) return callback(new Error("Request failed."), false);
    		var body = JSON.parse(b);
    		var device = body.device;
    		self.device = device;
    		self.lastUpdate = Date.now();
    		callback(null, device)
    	});
    } else {
    	callback(null, this.device);
    }
};

module.exports = RademacherAccessory;
