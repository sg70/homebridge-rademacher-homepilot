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
        var error = new Error("Unauthorized. Update the configuration with HomePilot's password.");
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
        this.log("Warning. No password has been configured. Consider protecting access to your HomePilot.");
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
            if (error.statusCode == 500) {
                // Salt endpoint fails with 500 when password is disabled.
                self.log("Warning. Password has been configured but does not appear to be enabled on HomePilot.");
                callback(null);
                return;
            }
            self.log("Login salt error: " + error);
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
                if (error.statusCode == 500) {
                    // 500 here when the salt endpoint worked means wrong password.
                    error = new Error("Wrong password. Make sure the configured HomePilot's password is correct.")
                }
                self.log("Login error: " + error);
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
    var self = this;
    this.request.post({
        url: this.url + "/authentication/logout",
        body: "",
        timeout: 2000
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            self.log("Logout error: " + error);
            callback(error);
        } else {
            callback(null);
        }
    });
};

RademacherHomePilotSession.prototype.get = function(path, timeout, callback) {
    var self = this;
    this.request.get({
        url: this.url + path,
        timeout: timeout
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            self.log("GET error for path %s%s: %s",self.url,path,error);
            callback(error, null);
        } else {
            callback(null, JSON.parse(b));
        }
    });
};

RademacherHomePilotSession.prototype.put = function(path, params, timeout, callback) {
    var self = this;
    this.request.put({
        url: this.url + path,
        headers: {'content-type' : 'application/json'},
        body: JSON.stringify(params),
        timeout: timeout
    }, function(e, r, b) {
        var error = responseError(e, r);
        if (error) {
            self.log("PUT error for path %s%s: %s",self.url,path,error);
            callback(error);
        } else {
            callback(null);
        }
    });
};

module.exports = RademacherHomePilotSession;
