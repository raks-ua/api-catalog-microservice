'use strict';

const config = require('config');
const request = require('request');
let self;

let appCache = new Map();

class ApiAppModel {
    constructor(){
        self = this;
        this.debug = true;
    }

    /**
     *
     * @param key
     * @param secret
     * @param callback
     */
    fetchApp(key, secret, callback) {
        let t1 = Date.now();
        request.get(config['API_APP']['URL'] + '/api/app/' + key + '/' + secret, {
            timeout: config['API_APP']['TIMEOUT'],
            strictSSL: false
        }, (err, res, body) => {
            if (err) {
                if (self.debug) console.log('[fail fetch url time]', (Date.now() - t1) / 1000);
                return callback && callback(err);
            }
            if (body.error) {
                if (self.debug) console.log('[fail fetch url time]', (Date.now() - t1) / 1000);
                return callback && callback(body.error);
            }
            let r = JSON.parse(body);

            if (r.error) {
                if (self.debug) console.log('[fail fetch url time]', (Date.now() - t1) / 1000);
                return callback && callback(r.error.message);
            }
            if (self.debug) console.log('[fetch url time]', (Date.now() - t1) / 1000);
            callback && callback(undefined, r);
        });
    }

    /**
     *
     * @param callback
     */
    fetchAll(callback) {
        let t1 = Date.now();
        request.get(config['API_APP']['URL'] + '/api/apps?api_key=' + config['API_APP']['KEY'] + '&api_secret=' + config['API_APP']['SECRET'], {
            timeout: config['API_APP']['TIMEOUT'],
            strictSSL: false
        }, (err, res, body) => {
            if (err) {
                if (self.debug) console.log('[fail fetch url time]', (Date.now() - t1) / 1000);
                return callback && callback(err);
            }
            if (body.error) {
                if (self.debug) console.log('[fail fetch url time]', (Date.now() - t1) / 1000);
                return callback && callback(body.error);
            }
            //console.log(body);
            let r = JSON.parse(body);

            if (r.error) {
                if (self.debug) console.log('[fail fetch url time]', (Date.now() - t1) / 1000);
                return callback && callback(r.error.message);
            }
            if (self.debug) console.log('[fetch url time]', (Date.now() - t1) / 1000);
            callback && callback(undefined, r);
        });
    }


    /**
     * Loading translations from URL
     * @param key
     * @param secret
     * @param callback
     */
    get(key, secret, callback) {
        let appData = appCache.get(key);
        if(appData) {
            if(appData.time + 5*60 > Date.now() / 1000) {
                console.log('cache', appData, Date.now() / 1000);
                return callback && callback(undefined, appData.app);
            }
        }
        this.fetchApp(key, secret, (err, data) => {
            if (err) return callback && callback(err);
            appCache.set(key, {
                time: Date.now() / 1000,
                app: data
            });
            callback && callback(undefined, data);
        });
    }

    /**
     * Loading translations from URL
     * @param callback
     */
    getAll(callback) {
        this.fetchAll((err, data) => {
            if (err) return callback && callback(err);
            callback && callback(undefined, data);
        });
    }

}

module.exports = new ApiAppModel();