let should = require('should');
let catalogKeyModel = require('./catalog_key_model');

class CatalogModel {

    constructor() {}

    makeContent() {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    testCatalogStructure(data, updatedIsReq = false, dataIsReq = false){
        should.exist(data.id);
        should.exist(data.key);
        should.exist(data.content);
        should.exist(data.storage);
        should.exist(data.created);
        should.exist(data.objType);
        if(dataIsReq) should.exist(data.data);
        if(updatedIsReq) should.exist(data.updated);

        catalogKeyModel.testCatalogKeyStructure(data.key);
    }

    testCatalogsStructure(data){
        should.exist(data.catalogs);
        data.catalogs.constructor.should.eql(Array);
        for(let i=0; i < data.catalogs.length; i++){
            this.testCatalogStructure(data.catalogs[i]);
        }
    }

}

module.exports = new CatalogModel();