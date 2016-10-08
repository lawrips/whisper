'use strict';

const sprintf = require('sprintf'),
    nconf = require('nconf'),
    debug = require('debug')('whisper');

const logLevels = { 'trace': 10, 'debug': 20, 'info': 30, 'warning': 40, 'error': 50, 'fatal': 60 };

var logLevel = nconf.get('log:logLevel');
var arraySizeThreshold = nconf.get('thresholds:arraySizes:profile') || 10000;

var logCache = [];
var logCacheSize = nconf.get('log:logCacheSize');
var dumpOnError = nconf.get('log:dumpOnError');

module.exports = {
    debug: function (message) {
        if (Array.isArray(message)) {
            message = sprintf.apply(null, message);
        }
        var logInfo = buildLogMessage(message)
        if (logLevel <= logLevels['debug']) {
            debug(JSON.stringify(logInfo));            
        }
    },

    info: function (message) {
        if (Array.isArray(message)) {
            message = sprintf.apply(null, message);
        }
        var logInfo = buildLogMessage(message);
        if (logLevel <= logLevels['info']) {
            debug(JSON.stringify(logInfo));
        }
    },

    warning: function (message, signalId, userId, deviceId, contextId) {
        if (Array.isArray(message)) {
            message = sprintf.apply(null, message);
        }
        var logInfo = buildLogMessage(message)
        if (logLevel <= logLevels['warning']) {
            debug(JSON.stringify(logInfo));
        }
    },

    error: function (message) {
        if (Array.isArray(message)) {
            message = sprintf.apply(null, message);
        }
        var logInfo = buildLogMessage(message)
        if (logLevel <= logLevels['error']) {
            debug(JSON.stringify(logInfo));            
        }
    },
};

function buildLogMessage(message) {
    var logInfo = {
        'environment': process.env.NODE_ENV,
        'message': message
    }
    return logInfo;

}