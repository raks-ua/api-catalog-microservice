let testModel = require('../model/test_model');
let request = testModel.getRequest();
let should = require('should');

describe('controllers', function () {
    describe('ping', function () {
        describe('GET /api/ping', function () {
            it('not auth request', function (done) {
                testModel.getApiBasic('ping').end(
                    (err, res) => {
                        should.not.exist(err);
                        let data = res.body;
                        data.ok.should.eql(true);
                        done();
                    });
            });
        });
    });

});
