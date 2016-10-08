'use strict';

var developers = require('../../../config/developers.json');

module.exports = {
    // validate developer against a key
    validate : function(key) {
        if (developers[key]) {
                return true;
        }
        return false;
    }
}