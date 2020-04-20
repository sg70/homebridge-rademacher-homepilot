function RademacherAccessory(log, accessory, data, session) {
    var info = accessory.getService(global.Service.AccessoryInformation);
    
    accessory.context.manufacturer = "Rademacher";
    info.setCharacteristic(global.Characteristic.Manufacturer, accessory.context.manufacturer.toString());
    
    if (data.deviceNumber) 
    {
        accessory.context.model = data.deviceNumber;
        info.setCharacteristic(global.Characteristic.Model, accessory.context.model.toString());    
    }
    
    if (data.uid) 
    {
        accessory.context.serial = data.uid;
    }
    else if (data.sid)
    {
        accessory.context.serial = data.sid;
    }
    info.setCharacteristic(global.Characteristic.SerialNumber, accessory.context.serial.toString());

    accessory.context.revision = 1; //data.version;
    info.setCharacteristic(global.Characteristic.FirmwareRevision, accessory.context.revision.toString());
    
    this.accessory = accessory;
    this.log = log;
    this.session = session;
    this.did = data.did;
    this.lastUpdate = 0;
    this.device = null;
}

RademacherAccessory.prototype.getDevice = function(callback) {
    if (this.lastUpdate < Date.now()) {
        var self = this;
        this.session.get("/v4/devices/" + this.did, 5000, function(e, body) {
    		if(e) return callback(new Error("Request failed: "+e), false);
            if (body.hasOwnProperty("device") || body.hasOwnProperty("meter"))
            {
                var device = body.hasOwnProperty("device")?body.device:body.meter;
                self.device = device.data;
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
