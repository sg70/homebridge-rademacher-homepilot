class RademacherBlindsAccessory {

    constructur(log, accessory, blind, url, inverted) {
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

    setTargetPosition(value, callback) {
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

    getTargetPosition(callback) {
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

    getCurrentPosition(callback) {
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

    getPositionState(callback) {
        callback(null, this.currentPositionState);
    };

}

module.exports = RademacherBlindsAccessory;