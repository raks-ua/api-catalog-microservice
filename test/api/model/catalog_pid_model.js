let should = require('should');
let catalogModel = require('./catalog_model');

class CatalogPidModel {

    constructor() {}

    testCatalogPidStructure(data){
        should.exist(data.id);
        should.exist(data.pid);
        should.exist(data.storage);
        should.exist(data.catalog);
        catalogModel.testCatalogStructure(data.catalog);
    }

}

module.exports = new CatalogPidModel();