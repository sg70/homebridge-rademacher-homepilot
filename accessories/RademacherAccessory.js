var request = require("request");

function RademacherAccessory(log, accessory, data, url) {
    var info = accessory.getService(global.Service.AccessoryInformation);
    
    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(global.Characteristic.Manufacturer, accessory.context.manufacturer.toString());
    
    accessory.context.model = data.deviceNumber;
    info.setCharacteristic(global.Characteristic.Model, accessory.context.model.toString());
    
    accessory.context.serial = data.uid;
    info.setCharacteristic(global.Characteristic.SerialNumber, accessory.context.serial.toString());
    
    accessory.context.revision = 1; //data.version;
    info.setCharacteristic(global.Characteristic.FirmwareRevision, accessory.context.revision.toString());
    
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
    		url: this.url + "/v4/devices/" + this.did
    	}, function(e,r,b) {
    		if(e) return callback(new Error("Request failed."), false);
            var body = JSON.parse(b);
            if (body.device || body.meter)
            {
                var device = body.device?body.device:body.meter;
                self.device = device;
                self.lastUpdate = Date.now();
                callback(null, device)    
            }
            else
            {
                self.log('no device, no meter');
                callback(null, self.device);
            }
    	});
    } else {
    	callback(null, this.device);
    }
};

module.exports = RademacherAccessory;
