var request = require("request");
var crypto = require('crypto');

function sha256hex(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function responseError(e, r) {
    if (e) {
        return e;
    }
    if (r.statusCode == 200) {
        return null;
    }
    if (r.statusCode == 401) {
        var error = new Error("Unauthorized. Is access to HomePilot protected with a password?");
        error.statusCode = r.statusCode;
        return error;
    }
    var error = new Error("Request failed: " + r.statusCode);
    error.statusCode = r.statusCode;
    return error;
}

function RademacherHomePilotSession(log, url, password) {
    this.log = log;
    this.url = url;
    this.password = password ? sha256hex(password) : null;
    this.request = request.defaults({
        strictSSL: false,
        jar: true // enable cookie store
    });
}

RademacherHomePilotSession.prototype.login = function(callback) {
    if (!this.password) {
        // insecure mode -- skip login
        this.log("No password found. Consider protecting access to HomePilot with a password.");
        callback(null);
        return;
    }
    var self = this;
    this.request.post({
        url: this.url + "/authentication/password_salt",
        body: "",
        timeout: 1500
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            callback(error);
            return;
        }
        var salt = JSON.parse(b).password_salt;
        var post = {
            password: sha256hex(salt + self.password),
            password_salt: salt
        };
        self.request.post({
            url: self.url + "/authentication/login",
            body: JSON.stringify(post),
            timeout: 2500
        }, function(e, r, b) {
            var error = responseError(e, r);
            if (error) {
                callback(error);
                return;
            }
            self.log("Successfully logged into HomePilot.");
            callback(null);
        });
    })
};

RademacherHomePilotSession.prototype.logout = function(callback) {
    if (!this.password) {
        callback(null);
        return;
    }
    this.request.post({
        url: this.url + "/authentication/logout",
        body: "",
        timeout: 2000
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    });
};

RademacherHomePilotSession.prototype.get = function(path, timeout, callback) {
    this.request.get({
        url: this.url + path,
        timeout: timeout
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            callback(error, null);
        } else {
            callback(null, JSON.parse(b));
        }
    });
};

RademacherHomePilotSession.prototype.put = function(path, params, timeout, callback) {
    this.request.put({
        url: this.url + path,
        headers: {'content-type' : 'application/json'},
        body: JSON.stringify(params),
        timeout: timeout
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    });
};

module.exports = RademacherHomePilotSession;
