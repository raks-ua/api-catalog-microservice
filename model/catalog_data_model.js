'use strict';

let sqlModel = require('./sql_model');
let Catalog = require('../entity/catalog');

let self;

class CatalogDataModel {

    constructor() {
        self = this;
    }

    getTable(namespace, storage) {
        return namespace + '_' + storage + '_app_catalog_data';
    }

    createOrUpdate(namespace, storage, catalogId, data, callback) {
        sqlModel.insertQuery('INSERT INTO ' + this.getTable(namespace, storage)
            + ' (catalog_id, data, created) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data) ',
            [catalogId, JSON.stringify(data), new Date()],
            (err, id) => {
                if (!err && id) {
                    return this.get(namespace, storage, id, callback);
                }
                callback && callback(err);
            });
    }

    /**
     * Getting Catalog Item by id
     * @param namespace
     * @param storage
     * @param {Number} id
     * @param {Function} callback
     * @returns {Catalog|undefined}
     */
    get(namespace, storage, id, callback) {
        sqlModel.getOne('SELECT * FROM ' + this.getTable(namespace, storage) + '  WHERE id = ? LIMIT 1', id, (err, row) => {
            if (err || !row) {
                return callback && callback(err);
            }
            callback && callback(err, row);
        });
    };

    /**
     * Removing Catalog Item by id
     * @param namespace
     * @param storage
     * @param {Number} id
     * @param {Function} callback
     * @returns {Catalog|undefined}
     */
    delete(namespace, storage, id, callback) {
        sqlModel.query('DELETE FROM ' + this.getTable(namespace, storage) + '  WHERE id = ?', id, (err) => {
            callback && callback(err);
        });
    };

}

module.exports = new CatalogDataModel();