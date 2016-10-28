'use strict';

var debug = require('debug')('whisper');
var nconf = require('nconf');
nconf.env().file({ file: './config/' + (process.env.NODE_ENV || 'production') + '.json' });
var app = require('./lib/app');

