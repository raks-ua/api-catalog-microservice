'use strict';

const responseModel = new (require("../../model/response/response_model"));
const catalogResponseModel = new (require("../../model/response/catalog_response_model"));
const catalogModel = require("../../model/catalog_model");
const catalogKeyModel = require("../../model/catalog_key_model");
const apiAppModel = require("../../model/api_app_model");


function all(req, res) {
    let p = req.swagger.params;
    let params = {
        key: p.key.value,
        pid: p.pid.value,
    };
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::all');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));

        if (!params.key || params.key === 'undefined') {
            return catalogModel.getAll(appData.namespace, params.pid, undefined, (err, catalogs) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                res.json(catalogResponseModel.getCatalogsResponse(catalogs));
            });
        }

        catalogKeyModel.getByName(appData.namespace, params.key, (err, catalogKey) => {
            if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
            if (!catalogKey) return res.json(responseModel.getErrorResponse('No key', {query: params}));
            catalogModel.getAll(appData.namespace, params.pid, catalogKey, (err, catalogs) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                res.json(catalogResponseModel.getCatalogsResponse(catalogs));
            });
        });
    });
}

module.exports = {
    all
};
