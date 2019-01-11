'use strict';

let config = require('config');
let SessionModel = require('wap3-app-session').Wap3AppSessionModel;

let sessionModel = new SessionModel({
    appService: 'catalog',
    url: config['API_SESSION']['URL'],
    timeout: config['API_SESSION']['TIMEOUT'],
    debug: true
});

module.exports = sessionModel;