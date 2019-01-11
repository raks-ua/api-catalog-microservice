'use strict';

class Catalog {
    constructor(data){
        this.data = data;
    }

    getByKey(key) {
        // if (!this.data[key]) {
        if (!(key in this.data)) {
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
     * @returns []
     */
    getParent() {
        return this.getByKey('parent');
    }

    /**
     * @returns {CatalogKey}
     */
    getCatalogKey() {
        return this.getByKey('catalogKey');
    }


    /**
     * @returns {String}
     */
    getContent() {
        return this.getByKey('content');
    }

    /**
     * @returns {String}
     */
    getStorage() {
        return this.getByKey('storage');
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
    getUpdated() {
        return this.getByKey('updated');
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

module.exports = Catalog;