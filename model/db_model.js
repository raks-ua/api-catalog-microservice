'use strict';

let sqlModel = require('./sql_multiple_model');
let fs = require('fs');
let apiAppModel = require('./api_app_model');
let PubNub = require('pubnub');
let config = require('config');

let self;

/**
 * https://dev.mysql.com/doc/refman/8.0/en/identifiers.html
 */
class DBModel {

    constructor() {
        self = this;
    }

    checkTablesMain(namespace, callback) {
        let q = "SHOW TABLES LIKE ?";
        sqlModel.query(q, [namespace + '_app_%'], (err, rows) => {
            if (err) return callback && callback(err);
            callback && callback(undefined, rows);
        });
    }

    checkTablesStorage(namespace, storage, callback) {
        let q = "SHOW TABLES LIKE ?";
        sqlModel.query(q, [namespace + '_' + storage + '_app_%'], (err, rows) => {
            if (err) return callback && callback(err);
            callback && callback(undefined, rows);
        });
    }

    addTablesMain(namespace, callback) {
        let filename = './data/structure_main.sql';
        let data = fs.readFileSync(filename, 'utf8');
        data = data.replace(/\[SERVICE_APP_NAME\]/igm, namespace + '_app');
        sqlModel.query(data, (err) => {
            callback && callback(err);
        });
    }

    addTablesStorage(namespace, storage, callback) {
        let filename = './data/structure_storage.sql';
        let data = fs.readFileSync(filename, 'utf8');
        data = data.replace(/\[SERVICE_APP_NAME\]_\[SERVICE_STORAGE\]/igm, namespace + '_' + storage + '_app');
        data = data.replace(/\[SERVICE_APP_NAME\]/igm, namespace + '_app');
        sqlModel.query(data, (err) => {
            callback && callback(err);
        });
    }


    initTablesMain(callback) {
        apiAppModel.getAll((err, apps) => {
            if (err) return callback && callback(err);
            //console.log(apps);
            //return callback();
            let p = [];
            for (let i = 0; i < apps.length; i++) {
                if (apps[i].services.indexOf('catalog') === -1) continue;
                p.push(new Promise((resolve, reject) => {
                    this.checkTablesMain(apps[i].namespace, (err, tables) => {
                        if (err) return reject();
                        if (tables && tables.length > 0) return resolve();
                        this.addTablesMain(apps[i].namespace, () => {
                            resolve();
                        });
                    });
                }));
            }

            Promise.all(p).then(() => {
                callback && callback();
            }).catch((err) => {
                callback && callback(err);
            });
        });
    }


    /**
     *
     * @param app {App}
     * @param storage {string}
     * @param callback
     */
    initTablesStorage(app, storage, callback) {
        this.checkTablesStorage(app.namespace, storage, (err, tables) => {
            if (err) return callback && callback(err);
            if (tables && tables.length > 0) return callback && callback();
            this.addTablesStorage(app.namespace, storage, () => {
                callback && callback();
            });
        });
    }

    /**
     * Using for RELOAD translates. Callback using for informing
     * @param callback
     */
    listen(callback) {
        let listener = new PubNub({
            publishKey: config['API_APP']['PUBNUB']['PUBLISH_KEY'],
            subscribeKey: config['API_APP']['PUBNUB']['SUBSCRIBE_KEY']
        });

        listener.addListener({
            status: function (statusEvent) {
                //console.log(statusEvent);
            },
            message: function (message) {
                console.log('piy', message);
                if (message.message === 'app.create') {
                    callback && callback();
                }
            },
            presence: function (presenceEvent) {
                // handle presence
            }
        });
        console.log("Subscribing APP MANAGER");
        listener.subscribe({
            channels: ['catalog']
        });
    }

}

module.exports = new DBModel();