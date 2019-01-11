'use strict';

let sqlModel = require('./sql_model');
let CatalogKey = require('../entity/catalog_key');

let self;

class CatalogKeyModel {

    constructor() {
        self = this;
    }

    getTable(namespace) {
        return namespace + '_app_catalog_key';
    }

    create(namespace, name, callback) {
        sqlModel.insertQuery('INSERT INTO ' + this.getTable(namespace) + ' (name, created) VALUES (?, ?)',
            [name, new Date()],
            (err, id) => {
                if (!err && id) {
                    return this.get(namespace, id, callback);
                }
                callback && callback(err);
            });
    }

    /**
     * Getting Catalog Key by id
     * @param namespace
     * @param {Number} id
     * @param {Function} callback
     * @returns {Catalog|undefined}
     */
    get(namespace, id, callback) {
        let sql = 'SELECT * FROM ' + this.getTable(namespace) + '  WHERE id = ?';

        sqlModel.getOne(sql, [id], (err, row) => {
            if (err || !row) {
                return callback && callback(err);
            }

            this.make(namespace, row, (err, catalogKey) => {
                if (err || !catalogKey) {
                    return callback && callback(err);
                }
                callback && callback(err, catalogKey);
            });
        });
    };

    /**
     * @param namespace
     * @param name
     * @param {Function} callback
     * @returns {CatalogKey}
     */
    getOrCreate(namespace, name, callback) {
        this.getByName(namespace, name, (err, catalogKey) => {
            if (!err && catalogKey) {
                return callback && callback(err, catalogKey);
            }
            this.create(namespace, name, callback);
        });
    };

    /**
     * Getting User by alexaUserId
     * @param namespace
     * @param name
     * @param {Function} callback
     * @returns {CatalogKey|undefined}
     */
    getByName(namespace, name, callback) {
        sqlModel.getOne('SELECT * FROM ' + this.getTable(namespace) + ' WHERE name = ? LIMIT 1', [name], (err, row) => {
            if (err || !row) {
                return callback && callback(err);
            }
            this.get(namespace, row.id, callback);
        });
    };


    /**
     * Getting [CatalogKey] by names
     * @param namespace
     * @param names
     * @param {Function} callback
     * @returns [CatalogKey] | []
     */
    getByNames(namespace, names, callback) {

        let where = [];
        let values = [];
        for(let i = 0; i < names.length; i++){
            where.push('name = ?');
            values.push(names[i]);
        }

        sqlModel.query('SELECT * FROM ' + this.getTable(namespace) + ' WHERE '+ where.join(' OR ') , names, (err, rows) => {
            if (err || !rows || rows.length === 0) return callback && callback(err);
            if (rows.length === 0) return callback && callback(undefined, []);

            let p = [];
            for (let i = 0; i < rows.length; i++) {
                p.push(new Promise((resolve, reject) => {
                    this.get(namespace, rows[i].id, (err, catalogKey) => {
                        if (err) return reject(err);
                        resolve(catalogKey);
                    });
                }));
            }

            Promise.all(p).then((catalogKeys) => {

                callback && callback(undefined, catalogKeys);
            }).catch((err) => {
                return callback && callback(err, []);
            });
        });
    };


    /**
     * @param namespace
     * @param {Object} data
     * @param {Function} callback
     * @returns {CatalogKey}
     */
    make(namespace, data, callback) {
        let objData = {
            id: data.id,
            name: data.name,
            created: data.created
        };
        let promises = [];

        Promise.all(promises).then(values => {
            let obj = new CatalogKey(objData);
            callback && callback(undefined, obj);
        }).catch(err => {
            console.log('catalog key errors', err, err && err.stack);
            let obj = new CatalogKey(objData);
            callback && callback(undefined, obj);
        });
    };
}

module.exports = new CatalogKeyModel();