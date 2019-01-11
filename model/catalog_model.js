'use strict';

let sqlModel = require('./sql_model');
let catalogKeyModel = require('./catalog_key_model');
let catalogDataModel = require('./catalog_data_model');
let catalogPidModel = require('./catalog_pid_model');
let Catalog = require('../entity/catalog');
let md5 = require('md5');

let self;

class CatalogModel {

    constructor() {
        self = this;
    }

    getTable(namespace, storage) {
        return namespace + '_' + storage + '_app_catalog';
    }

    /**
     *
     * @param namespace
     * @param storage
     * @param key
     * @param content
     * @param data
     * @param callback
     */
    create(namespace, storage, key, content, data, callback) {
        sqlModel.insertQuery('INSERT INTO ' + this.getTable(namespace, storage) + ' (key_id, content, content_hash, created) VALUES (?, ?, ?, ?)',
            [key.getId(), content, md5(content), new Date()],
            (err, id) => {
                if(err) return callback && callback(err);
                if (id) {
                    let p = [];
                    if(data){
                        p.push(new Promise((resolve, reject) => {
                            catalogDataModel.createOrUpdate(namespace, storage, id, data, (err, data)=>{
                                if (err) return reject(err);
                                resolve(data);
                            });
                        }));
                    }
                    Promise.all(p).then((d)=>{
                        return this.get(namespace, storage, id, callback);
                    }).catch((e)=>{
                        return callback && callback(e);
                    });
                }
            });
    }

    update(namespace, storage, params, callback) {
        let val = [];
        let sql = "UPDATE "+ this.getTable(namespace, storage);
        let set = " SET ";
        if(params.key){
            set += ' key_id = ? ';
            val.push(params.key.getId());
        }

        if(params.content){
            if(val.length > 0) set += ",";
            set += " content = ? ";
            val.push(params.content);

            if(val.length > 0) set += ",";
            set += " content_hash = ? ";
            val.push(md5(params.content));
        }

        if(val.length > 0) set += ",";
        set += " updated = ? ";
        val.push(new Date());


        let p = [];

        let where = " WHERE id = ? ";
        val.push(params.id);
        sql = sql+set+where;

        if(val.length > 0){
            p.push(new Promise((resolve, reject) => {
                sqlModel.query( sql, val,
                    (err, data) => {
                        if (err) return reject(err);
                        resolve(data);
                    });
            }));
        }

        if(params.data && params.id){
            p.push(new Promise((resolve, reject) => {
                catalogDataModel.createOrUpdate(namespace, storage, params.id, params.data, (err, data)=>{
                    if (err) return reject(err);
                    resolve(data);
                });
            }));
        }

        Promise.all(p).then((d)=>{
            return this.get(namespace, storage, params.id, callback);
        }).catch((e)=>{
            return callback && callback(e);
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
        let catalogTable = this.getTable(namespace, storage);
        let catalogDataTable = catalogDataModel.getTable(namespace, storage);


        let sql = 'SELECT '+catalogTable+'.*, '+catalogDataTable+'.data FROM ' + catalogTable + ' LEFT JOIN ' +
            catalogDataTable + ' ON '+catalogTable+'.id = ' +
            catalogDataTable + '.catalog_id WHERE '+catalogTable+'.id = ? LIMIT 1 ';
        sqlModel.getOne(sql, id, (err, row) => {
            if (err || !row) {
                return callback && callback(err);
            }

            this.make(namespace, storage, row, function (err, catalog) {
                if (err || !catalog) {
                    return callback && callback(err);
                }
                callback && callback(err, catalog);
            });
        });
    };

    /**
     * Getting Catalog Item by id
     * @param namespace
     * @param storage
     * @param {Number} pid
     * @param {Function} callback
     * @returns {[Catalog]|undefined}
     */
    //TODO: finish method
    getByPid(namespace, storage, pid, callback) {
        let catalogTable = this.getTable(namespace, storage);
        let catalogPidTable = catalogPidModel.getTable(namespace, storage);
        let catalogDataTable = catalogDataModel.getTable(namespace, storage);

        let sql = 'SELECT '+catalogTable+'.*, '+catalogDataTable+'.data FROM ' + catalogTable + ' LEFT JOIN ' +
            catalogDataTable + ' ON '+catalogTable+'.id = ' +
            catalogDataTable + '.catalog_id WHERE '+catalogTable+'.id = ? ';

        sqlModel.query(sql, id, (err, row) => {
            if (err || !row) {
                return callback && callback(err);
            }

            this.make(namespace, storage, row, function (err, catalog) {
                if (err || !catalog) {
                    return callback && callback(err);
                }
                callback && callback(err, catalog);
            });
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
        let p = [];
        p.push(new Promise((resolve, reject) => {
            let sql = 'DELETE FROM ' + catalogDataModel.getTable(namespace, storage) + ' WHERE catalog_id = ? ';
            sqlModel.query(sql, id, (err) => {
                if(err) return reject(err);
                return resolve();
            });
        }));
        p.push(new Promise((resolve, reject) => {
            let sql = 'DELETE FROM ' + this.getTable(namespace, storage) + '  WHERE id = ? ';
            sqlModel.query(sql, id, (err) => {
                if(err) return reject(err);
                return resolve();
            });
        }));

        Promise.all(p).then((d)=>{
            callback && callback();
        }).catch((e)=>{
            callback && callback(e);
        });

    };

    /**
     *
     * @param namespace
     * @param storage
     * @param id
     * @param pid
     * @param callback
     */
    link(namespace, storage, id, pid, callback) {
        let p = [];
        p.push(new Promise((resolve, reject) => {
            let sql = 'DELETE FROM ' + catalogDataModel.getTable(namespace, storage) + ' WHERE catalog_id = ? ';
            sqlModel.query(sql, id, (err) => {
                if(err) return reject(err);
                return resolve();
            });
        }));
        p.push(new Promise((resolve, reject) => {
            let sql = 'DELETE FROM ' + this.getTable(namespace, storage) + '  WHERE id = ? ';
            sqlModel.query(sql, id, (err) => {
                if(err) return reject(err);
                return resolve();
            });
        }));

        Promise.all(p).then((d)=>{
            callback && callback();
        }).catch((e)=>{
            callback && callback(e);
        });

    };

    /**
     * Getting User by alexaUserId
     * @param namespace
     * @param storage
     * @param key
     * @param content
     * @param {Function} callback
     * @returns {CatalogKey|undefined}
     */
    getByKeyContent(namespace, storage, key, content, callback) {
        let values = [key.getId(), md5(content)];
        let q = 'SELECT * FROM ' + this.getTable(namespace, storage) + ' WHERE key_id = ? AND content_hash = ? LIMIT 1';
        //console.log(q, values);
        sqlModel.getOne(q,
            values,
            (err, row) => {
                if (err || !row) {
                    return callback && callback(err);
                }
                this.get(namespace, storage, row.id, callback);
            });
    };

    /**
     * Getting User by alexaUserId
     * @param namespace
     * @param storage
     * @param pid
     * @param key
     * @param {Function} callback
     * @returns {CatalogKey|undefined}
     */
    getRandomItem(namespace, storage, pid, key, callback) {

        let values = [key.getId()];
        if (pid) values.push(pid);
        let q = 'SELECT * FROM ' + this.getTable(namespace, storage) + ' WHERE key_id = ? ' + (pid ? 'AND pid = ?' : 'AND pid IS NULL') + ' ORDER BY RAND() LIMIT 1';
        sqlModel.getOne(q,
            values,
            (err, row) => {
                console.log(err, row);
                if (err || !row) {
                    return callback && callback(err);
                }
                this.get(namespace, row.id, callback);
            });
    };

    /**
     *
     * @param namespace
     * @param storage
     * @param limit
     * @param pids []
     * @param keys []
     * @param {Function} callback
     */
    getRandomItems(namespace, storage, limit, pids = [], keys = [], callback) {

        let keyIds = [];
        let values = [];
        let wherePids = [];
        let whereKeys = [];

        if(keys.length > 0) keyIds = keys.map((item)=>{return item.getId()});
        let catalogTableName = this.getTable(namespace, storage);
        let catalogPidTableName = catalogPidModel.getTable(namespace, storage);

        for(let i = 0; i < pids.length; i++){
            wherePids.push('pid = ?');
            values.push(pids[i]);
        }

        for(let i = 0; i < keyIds.length; i++){
            whereKeys.push('key_id = ?');
            values.push(keyIds[i]);
        }

        let q = 'SELECT DISTINCT '+catalogTableName+'.id FROM ' + catalogPidTableName
            + ' LEFT JOIN '+catalogTableName+' ON '+catalogTableName+'.id = '+catalogPidTableName+'.catalog_id WHERE ';

        if(wherePids.length > 0) q += '('+wherePids.join(' OR ')+')';
        if(whereKeys.length > 0 && wherePids.length > 0) q += ' AND ';
        if(whereKeys.length > 0 ) q += '('+whereKeys.join(' OR ')+')';

        q += ' ORDER BY RAND() LIMIT ? ';
        values.push(limit);

        sqlModel.query(q,
            values,
            (err, rows) => {
                console.log(err, rows);

                if (err || !rows || rows.length === 0) {
                    return callback && callback(err, []);
                }
                let p = [];
                for (let i = 0; i < rows.length; i++) {
                    p.push(new Promise((resolve, reject) => {
                        this.get(namespace, storage, rows[i].id, (err, catalog) => {
                            if (err) return reject(err);
                            resolve(catalog);
                        });
                    }));
                }

                Promise.all(p).then((catalogs) => {
                    callback && callback(undefined, catalogs);
                }).catch((err) => {
                    return callback && callback(err, []);
                });
            });
    };

    /**
     *
     * @param namespace
     * @param storage
     * @param limit
     * @param order: <{column: <string>, position: <string>}>
     * @param keys []
     * @param {Function} callback
     */
    getOrdersIds(namespace, storage, limit, keys, order, callback) {

        let keyIds = [];
        let values = [];
        let whereKeys = [];

        if(keys.length > 0) keyIds = keys.map((item)=>{return item.getId()});
        let catalogTableName = this.getTable(namespace, storage);

        for(let i = 0; i < keyIds.length; i++){
            whereKeys.push('key_id = ?');
            values.push(keyIds[i]);
        }

        let q = 'SELECT id FROM ' + catalogTableName + ' WHERE ';

        if(whereKeys.length > 0 ) q += ' '+whereKeys.join(' OR ')+' ';

        q += ' ORDER BY '+order.column+' '+order.position+' LIMIT ? ';
        values.push(limit);

        sqlModel.query(q,
            values,
            (err, rows) => {
                console.log(err, rows);
                if (err || !rows || rows.length === 0) {
                    return callback && callback(err, []);
                }

                let ids = rows.map((item)=>{return item.id});
                return callback && callback(undefined, ids);
            });
    };

    /**
     * Getting User by alexaUserId
     * @param namespace
     * @param storage
     * @param pid
     * @param key
     * @param {Function} callback
     * @returns {CatalogKey|undefined}
     */
    getAll(namespace, storage, pid, key, callback) {
        let values = [];
        let where = [];

        if (key) {
            where.push('key_id = ?');
            values.push(key.getId());
        }
        if (pid) {
            where.push('pid = ?');
            values.push(pid);
        } else {
            where.push('pid IS NULL');
        }
        let q = 'SELECT * FROM ' + this.getTable(namespace, storage);
        if (where.length > 0) {
            q += ' WHERE ' + where.join(' AND ');
        }
        sqlModel.query(q,
            values,
            (err, rows) => {
                if (err || !rows || rows.length === 0) {
                    return callback && callback(err, []);
                }
                let p = [];
                for (let i = 0; i < rows.length; i++) {
                    p.push(new Promise((resolve, reject) => {
                        this.make(namespace, storage, rows[i], (err, catalog) => {
                            if (err) return reject(err);
                            resolve(catalog);
                        });
                    }));
                }
                Promise.all(p).then((catalogs) => {
                    callback && callback(undefined, catalogs);
                }).catch((err) => {
                    return callback && callback(err, []);
                });

            });
    };


    /**
     * @param namespace
     * @param storage
     * @param {Object} data
     * @param {Function} callback
     * @returns {Catalog}
     */
    make(namespace, storage, data, callback) {

        let objData = {
            id: data.id,
            pid: undefined,
            catalogKey: undefined,
            content: data.content,
            data: JSON.parse(data.data),
            storage: storage,
            created: data.created,
            updated: data.updated
        };
        let promises = [];

        promises.push(new Promise((resolve, reject) => {
            catalogPidModel.getPidsById(namespace, storage, objData.id, (err, pids)=>{
                if (err) return reject(err);
                objData.parent = pids;
                resolve();
            });
        }));

        promises.push(new Promise((resolve, reject) => {
            catalogKeyModel.get(namespace, data.key_id, (err, catalogKey) => {
                if (err) return reject(err);
                objData.catalogKey = catalogKey;
                resolve();
            });
        }));

        Promise.all(promises).then(values => {
            let obj = new Catalog(objData);
            callback && callback(undefined, obj);
        }).catch(err => {
            console.log('catalog errors', err, err && err.stack);
            let obj = new Catalog(objData);
            callback && callback(undefined, obj);
        });
    };

}

module.exports = new CatalogModel();