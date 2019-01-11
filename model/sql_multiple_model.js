'use strict';

let config = require('config');

/**
 * type {Wap3LibSQL}
 */
let Wap3LibSQL = require('wap3-lib').Wap3LibSQL;

module.exports = new Wap3LibSQL({
    showLog: false,
    db: {
        host: config.DB.HOST,
        user: config.DB.USER,
        password: config.DB.PASSWORD,
        database: config.DB.NAME
    },
    multipleStatements: true
});