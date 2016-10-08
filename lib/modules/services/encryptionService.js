'use strict';

// Nodejs encryption with CTR
var crypto = require('crypto'),
    bcrypt = require('bcryptjs'),
    nconf = require('nconf');

var algorithm = 'aes-256-ctr';
    
module.exports = {
    encrypt: function (secret, iv, password) {
        var crypted;
        try {
            var cipher = crypto.createCipheriv(algorithm, new Buffer(password), new Buffer(iv));
            crypted = cipher.update(secret, 'utf8', 'hex');
            crypted += cipher.final('hex');
        }
        catch (ex) {
            return ex.message;
        }
        return crypted;
    },

    decrypt: function (secret, iv, password) {
        var dec;
        try {
            var decipher = crypto.createDecipheriv(algorithm, new Buffer(password), new Buffer(iv))
            dec = decipher.update(secret, 'hex', 'utf8')
            dec += decipher.final('utf8');
        }
        catch (ex) {
            return ex.message;
        }        
        return dec;
    },
    
    hashKey : function (key) {
        var hash = crypto.createHash('sha256');
        hash.update(key);
        var d = hash.digest('hex');
        return d;
    },
    
    // future function for consideration
    bHashKey : function (item) {
        var salt = bcrypt.genSaltSync(nconf.get('system:saltLength'));
        var hash = bcrypt.hashSync(item, salt);
        return {hash : hash, salt: salt};
    },

    // future function for consideration
    bReHashKey : function (item, salt) {
        var hash = bcrypt.hashSync(iv, salt);
        return hash;
    },
    
    bCompare : function(item, hash) {
        return bcrypt.compareSync(item, hash);    
    }
}

