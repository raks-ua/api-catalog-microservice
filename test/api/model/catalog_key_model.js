let should = require('should');

class CatalogKeyModel {

    constructor() {}

    testCatalogKeyStructure(data){
        should.exist(data.id);
        should.exist(data.name);
    }

}

module.exports = new CatalogKeyModel();