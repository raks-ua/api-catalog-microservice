let testModel = require('../model/test_model');
let catalogModel = require('../model/catalog_model');
let catalogPidModel = require('../model/catalog_pid_model');
let should = require('should');

let testObj = {
    "key": "test",
    "content": ""
};

let createdItems = {
    0: {},
    1: {}
};

testObj['content'] = catalogModel.makeContent();

describe('controllers', function () {
    describe('Catalog', function () {
        describe('POST /catalog/create', function () {
            it('Not auth POST request', function (done) {
                testModel.postApiBasic('catalog/create', {}).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(false);
                        data.message.should.eql('"Please set appKey"');
                        done();
                    });
            });

            it('Auth POST Create Request', function (done) {
                testModel.postSuccessApiAuthBasic('catalog/create', testObj).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        catalogModel.testCatalogStructure(data.data);

                        createdItems[0] = data.data;
                        done();
                    });
            });

            it('Auth GET Get Request', function (done) {
                testModel.getSuccessApiAuthBasic('catalog/' + createdItems[0].storage + '/' + createdItems[0].id).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        catalogModel.testCatalogStructure(data.data);
                        data.data.id.should.eql(createdItems[0].id);
                        data.data.content.should.eql(createdItems[0].content);
                        done();
                    });
            });

            it('Auth GET Get by key and content, Request', function (done) {
                testModel.getSuccessApiAuthBasic('catalog/' + createdItems[0].storage + '/' + createdItems[0].key.name + '/' + createdItems[0].content).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        catalogModel.testCatalogStructure(data.data);
                        data.data.id.should.eql(createdItems[0].id);
                        data.data.content.should.eql(createdItems[0].content);
                        done();
                    });
            });

            it('Auth POST Update content Request', function (done) {
                testObj = {};
                testObj['content'] = catalogModel.makeContent();
                testModel.postSuccessApiAuthBasic('catalog/' + createdItems[0].storage + '/' + createdItems[0].id, testObj).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        catalogModel.testCatalogStructure(data.data, true);
                        data.data.id.should.eql(createdItems[0].id);
                        data.data.content.should.eql(testObj['content']);
                        done();
                    });
            });

            it('Auth POST Link catalog Request', function (done) {
                testObj = {"key": "test1", "content": ""};
                testObj['content'] = catalogModel.makeContent();
                // Create one more test item for link
                testModel.postSuccessApiAuthBasic('catalog/create', testObj).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        catalogModel.testCatalogStructure(data.data);
                        createdItems[1] = data.data;
                        // Send link request
                        let linkData = {
                            "id": createdItems[1].id,
                            "pid": createdItems[0].id,
                            "storage": "main" // default storage is main
                        };

                        testModel.postSuccessApiAuthBasic('catalog/link', linkData).end(
                            (err, res) => {
                                let data = res.body;
                                data.ok.should.eql(true);
                                catalogPidModel.testCatalogPidStructure(data.data);

                                data.data.id.should.eql(linkData.id);
                                data.data.pid.should.eql(linkData.pid);
                                data.data.storage.should.eql(linkData.storage);

                                done();
                            });
                    });
            });

            it('Auth POST Random list Request', function (done) {
                let randomData = {"pids":[createdItems[0].id], "keys":[createdItems[0].key.name, createdItems[1].key.name]};
                testModel.postSuccessApiAuthBasic('catalog/list/random/main', randomData).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        catalogModel.testCatalogsStructure(data.data);

                        // default limit val is 1
                        data.data.catalogs.length.should.eql(1);
                        // Check key name match
                        (randomData.keys.indexOf(data.data.catalogs[0].key.name) >= 0).should.eql(true);
                        // Check pids match
                        (randomData.pids.filter((item)=>{
                            return data.data.catalogs[0].pids && data.data.catalogs[0].pids.indexOf(item) >= 0;
                        }).length > 0).should.eql(true);

                        // Change query data and test again
                        randomData['limit'] = 2;
                        delete randomData.pids;
                        testModel.postSuccessApiAuthBasic('catalog/list/random/main', randomData).end(
                            (err, res) => {
                                should.not.exist(err);
                                let data = res.body;
                                data.ok.should.eql(true);
                                catalogModel.testCatalogsStructure(data.data);
                                data.data.catalogs.length.should.eql(randomData.limit);

                                // Check key name match
                                (randomData.keys.indexOf(data.data.catalogs[0].key.name) >= 0).should.eql(true);

                                randomData['pids'] = [createdItems[0].id];
                                delete randomData['keys'];

                                testModel.postSuccessApiAuthBasic('catalog/list/random/main', randomData).end(
                                    (err, res) => {
                                        should.not.exist(err);
                                        let data = res.body;
                                        data.ok.should.eql(true);
                                        catalogModel.testCatalogsStructure(data.data);
                                        data.data.catalogs.length.should.eql(1);

                                        // Check pids match
                                        (randomData.pids.filter((item)=>{
                                            return data.data.catalogs[0].pids && data.data.catalogs[0].pids.indexOf(item) >= 0;
                                        }).length > 0).should.eql(true);

                                        done();
                                    });
                            });
                    });
            });

            it('Auth POST Order list Request', function (done) {

                let reqData = {
                    "limit": 2,
                    "order": {"column":"id", "position":"desc"},
                    "keys": [createdItems[0].key.name, createdItems[1].key.name]
                };
                testModel.postSuccessApiAuthBasic('catalog/list/order/main', reqData).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        data.data.ids.constructor.should.eql(Array);
                        (data.data.ids.length === 2).should.eql(true);
                        (data.data.ids[0] > data.data.ids[1]).should.eql(true);
                        reqData['order']['position'] = 'asc';
                        testModel.postSuccessApiAuthBasic('catalog/list/order/main', reqData).end(
                            (err, res) => {
                                should.not.exist(err);
                                let data = res.body;
                                data.ok.should.eql(true);
                                data.data.ids.constructor.should.eql(Array);
                                (data.data.ids.length === 2).should.eql(true);
                                (data.data.ids[0] < data.data.ids[1]).should.eql(true);
                                done();
                            });
                    });
            });

            it('Auth DELETE Request', function (done) {
                testModel.deleteSuccessApiAuthBasic('catalog/' + createdItems[0].storage + '/' + createdItems[0].id).end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);

                        testModel.deleteSuccessApiAuthBasic('catalog/' + createdItems[1].storage + '/' + createdItems[1].id).end(
                            (err, res) => {
                                should.not.exist(err);
                                let data = res.body;
                                data.ok.should.eql(true);

                                testModel.getSuccessApiAuthBasic('catalog/' + createdItems[0].storage + '/' + createdItems[0].id).end(
                                    (err, res) => {
                                        should.not.exist(err);
                                        let data = res.body;
                                        data.ok.should.eql(false);

                                        testModel.getSuccessApiAuthBasic('catalog/' + createdItems[1].storage + '/' + createdItems[1].id).end(
                                            (err, res) => {
                                                should.not.exist(err);
                                                let data = res.body;
                                                data.ok.should.eql(false);
                                                done();
                                            });
                                    });
                            });
                    });
            });
        });
    });

});
