'use strict';

const nconf = require('nconf');

let config = {};

if (nconf.get('slack:clientId') && nconf.get('slack:encryptionPassword') && nconf.get('slack:commandToken') && nconf.get('slack:clientSecret')) {
    config.slack = {
        slackClientId : nconf.get('slack:clientId')
    }
} 

if (nconf.get('email:transport')) {
    config.contact = true;
} 

module.exports = config;