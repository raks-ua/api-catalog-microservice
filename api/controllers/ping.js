'use strict';
let responseModel = new (require('../../model/response/response_model'));

function ping(req, res) {
    res.json(responseModel.getSuccessResponse());
}

module.exports = {
    ping: ping
};