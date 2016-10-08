'use strict';

const nconf = require('nconf');

// Check all params on startup
if (!nconf.get('whisper_websiteDeveloperKey')) {
    throw new Error ('must set whisper_websiteDeveloperKey in process.env, development.json or production.json')
}

if (!nconf.get('whisper_encryptionPassword')) {
    throw new Error ('must set whisper_encryptionPasswordd in process.env, development.json or production.json')
}
