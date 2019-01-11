'use strict';

class CatalogKey {
    constructor(data){
        this.data = data;        
    }

    getByKey(key) {
        if (!this.data[key]) {
            return undefined;
        }
        return this.data[key];
    }

    /**
     * @returns {Number}
     */
    getId() {
        return this.getByKey('id');
    }

    /**
     * @returns {String}
     */
    getName() {
        return this.getByKey('name');
    }

    /**
     * @returns {String}
     */
    getCreated() {
        return this.getByKey('created');
    }

    /**
     * @returns {String}
     */
    getData() {
        return this.getByKey('data');
    }

    /**
     * @returns {String}
     */
    setDataParam(param, value) {
        let data = this.getByKey('data');
        data[param] = value;
    }
}

module.exports = CatalogKey;