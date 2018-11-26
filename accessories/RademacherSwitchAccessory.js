class RademacherSwitchAccessory {

    constructor(log, accessory, sw, url) {
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

    getCurrentState(callback) {
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

    setCurrentState(value, callback) {
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
}

module.exports = RademacherSwitchAccessory;