'use strict';

let sessionModel = require('./session_model');

let self;

class AppModel {

    constructor() {
        self = this;
    }

    /**
     * @param appKey
     * @param appSecret
     * @param callback
     */
    check(appKey, appSecret, callback) {
        sessionModel.setAppKey(appKey);
        sessionModel.setAppSecret(appSecret);
        sessionModel.auth((err, session) => {
            if (err) return callback && callback(err);
            callback && callback(undefined, session);
        });
    }
}

module.exports = new AppModel();