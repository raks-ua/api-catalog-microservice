'use strict';

let sqlModel = require('./sql_model');

let self;

class CatalogPidModel {

    constructor() {
        self = this;
    }

    getTable(namespace, storage) {
        return namespace + '_' + storage + '_app_catalog_pid';
    }

    /**
     *
     * @param namespace
     * @param storage
     * @param id
     * @param pid
     * @param callback
     */
    link(namespace, storage, id, pid, callback) {
        let pidTable = this.getTable(namespace, storage);
        let sql = 'SELECT  * FROM ' + pidTable + ' WHERE catalog_id = ? AND pid = ? LIMIT 1 ';
        sqlModel.getOne(sql, [id, pid], (err, row) => {
            if(err) return callback && callback(err);
            if(row) return callback && callback('Duplicate found');

            let sql = 'INSERT INTO ' + this.getTable(namespace, storage) + ' (catalog_id, pid, created) VALUES (?, ?, ?)';
            sqlModel.insertQuery(sql, [id, pid, new Date()], (err) => {
                if(err) return callback && callback(err);
                return callback && callback();
            });
        });
    };

    getPidsById(namespace, storage, catalogId, callback){
        let pidTable = this.getTable(namespace, storage);
        let sql = 'SELECT '+pidTable+'.pid FROM ' + pidTable + ' WHERE catalog_id = ? ';

        sqlModel.query(sql, catalogId, (err, rows) => {
            if(err) return callback && callback(err);
            if(!rows || rows.length === 0) return callback && callback(undefined, []);
            let pids = rows.map((item)=>{return item.pid});

            return callback && callback(undefined, pids);
        });
    }

}

module.exports = new CatalogPidModel();