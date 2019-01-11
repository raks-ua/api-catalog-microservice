'use strict';

const responseModel = new (require("../../model/response/response_model"));
const catalogResponseModel = new (require("../../model/response/catalog_response_model"));
const catalogPidResponseModel = new (require("../../model/response/catalog_pid_response_model"));
const catalogModel = require("../../model/catalog_model");
const catalogPidModel = require("../../model/catalog_pid_model");
const catalogKeyModel = require("../../model/catalog_key_model");
const apiAppModel = require("../../model/api_app_model");
const dbModel = require("../../model/db_model");


function init(method, req, res, callback) {
    let params = req.swagger.params.catalog.value;
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::' + method);
    let storage = params.storage || 'main';
    let data = {
        appKey,
        appSecret,
        params,
        storage
    };

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return callback && callback('App error', data);
        data.appData = appData;
        dbModel.initTablesStorage(appData, storage, () => {
            if (params.key) {
                return catalogKeyModel.getOrCreate(appData.namespace, params.key, (err, catalogKey) => {
                    if (err) return callback && callback('Internal error', data);
                    data.key = catalogKey;
                    callback && callback(undefined, data);
                });
            }
            callback && callback(undefined, data);
        });
    });

}

function create(req, res) {
    init('create', req, res, (err, data) => {
        if (err) return res.json(responseModel.getErrorResponse(err, {query: data.params}));
        catalogModel.getByKeyContent(data.appData.namespace, data.storage, data.key, data.params.content, (err, catalog) => {
            if (err) return res.json(responseModel.getErrorResponse(err, {query: data.params}));
            if (catalog) return res.json(responseModel.getErrorResponse('Already exists', {query: data.params}));

            catalogModel.create(data.appData.namespace, data.storage, data.key, data.params.content, data.params.data, (err, catalog) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: data.params}));
                res.json(catalogResponseModel.getCatalogResponse(catalog));
            });
        });
    });
}

function update(req, res) {

    let params = req.swagger.params.data.value;
    params['id'] = req.swagger.params.id.value;
    params['storageOld'] = req.swagger.params.storage.value;
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::update');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));

        let p = [];
        if(params.key){
            p.push(new Promise((resolve, reject) => {
                catalogKeyModel.getOrCreate(appData.namespace, params.key, (err, catalogKey) => {
                    if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                    params['key'] = catalogKey;
                    resolve();
                });
            }));
        }
        p.push(new Promise((resolve, reject) => {
            catalogModel.get(appData.namespace, params.storageOld, params.id, (err, catalog) => {
                if (err) reject('Internal error');
                if (!catalog) reject('Not found');
                resolve();
            });
        }));

        Promise.all(p).then((d)=>{
            catalogModel.update(appData.namespace, params.storageOld, params, (err, catalog) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                res.json(catalogResponseModel.getCatalogResponse(catalog));
            });
        }).catch((e)=>{
            console.error(e);
            if (e) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
        });
    });
}

function remove(req, res) {
    let p = req.swagger.params;
    let params = {
        id: p.id.value,
        storage: p.storage.value
    };
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::remove');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));
        catalogModel.get(appData.namespace, params.storage,  params.id, (err, catalog) => {
            if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
            if (!catalog) return res.json(responseModel.getErrorResponse('Not found', {query: params}));
            catalogModel.delete(appData.namespace, params.storage, params.id, (err, catalog) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                res.json(catalogResponseModel.getSuccessResponse({}));
            });
        });
    });
}

function random(req, res) {

    let p = req.swagger.params;
    let params = req.swagger.params.data.value;
    params['storage'] = p.storage.value || 'main';
    params['limit'] = params.limit || 1;
    params['keys'] = params.keys || [];
    params['pids'] = params.pids || [];

    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::random');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));
        if ((!params.keys || !params.keys.length) && (!params.pids || !params.pids.length))
            return res.json(responseModel.getErrorResponse('Params error', {query: params}));
        let p = [];

        if (params.keys.length > 0)
            p.push(new Promise((resolve, reject) => {
                catalogKeyModel.getByNames(appData.namespace, params.keys, (err, catalogKeys) => {
                    if (err) return reject(err);
                    if (!catalogKeys) return reject('No keys found');
                    resolve(catalogKeys);
                });
            }));

        Promise.all(p).then((catalogKeys) => {
            catalogKeys = catalogKeys && catalogKeys[0] ? catalogKeys[0] : [];
            catalogModel.getRandomItems(appData.namespace, params.storage, params.limit, params.pids, catalogKeys, (err, catalogs) => {

                if (err || !catalogs.length) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                let resp = catalogResponseModel.getCatalogsResponse(catalogs);
                console.log("HERE ", catalogs,  resp);
                console.log("HERE 2 \n", resp, resp.data.catalogs);
                return res.json(resp);
            });
        }).catch((err)=>{

            return res.json(responseModel.getErrorResponse(err));
        });
    });
}


/**
 * Return array of catalog ids by keys and in defined order
 * @param req
 * @param res
 */
function list(req, res) {

    let p = req.swagger.params;
    let params = req.swagger.params.data.value;
    params['storage'] = p.storage.value || 'main';

    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::list');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));
        if ((!params.keys || !params.keys.length) && (!params.pids || !params.pids.length))
            return res.json(responseModel.getErrorResponse('Params error', {query: params}));

        catalogKeyModel.getByNames(appData.namespace, params.keys, (err, catalogKeys) => {
            if (err) return res.json(responseModel.getErrorResponse('Error', err));
            if (!catalogKeys || !catalogKeys.length) return res.json(responseModel.getErrorResponse('No keys found'));

            catalogModel.getOrdersIds(appData.namespace, params.storage, params.limit, catalogKeys, params.order,(err, catalogIds) => {
                if (err || !catalogIds.length) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                res.json(catalogResponseModel.getCatalogIdsResponse(catalogIds));
            });
        });
    });
}

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

function get(req, res) {
    let p = req.swagger.params;
    let params = {
        id: p.id.value,
        storage: p.storage.value
    };
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::get');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));
        catalogModel.get(appData.namespace, params.storage, params.id, (err, catalog) => {
            if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
            if (!catalog) return res.json(responseModel.getErrorResponse('Not found', {query: params}));
            res.json(catalogResponseModel.getCatalogResponse(catalog));
        });
    });
}

function link(req, res) {
    let params = req.swagger.params.data.value;
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::link');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));
        if (params.id === params.pid) return res.json(responseModel.getErrorResponse('Params error', {query: params}));

        catalogModel.get(appData.namespace, params.storage,  params.pid, (err, catalog) => {
            if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
            if (!catalog) return res.json(responseModel.getErrorResponse('Parent not found', {query: params}));

            catalogModel.get(appData.namespace, params.storage,  params.id, (err, catalog) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                if (!catalog) return res.json(responseModel.getErrorResponse('Not found', {query: params}));

                catalogPidModel.link(appData.namespace, params.storage, params.id, params.pid, (err) => {
                    if (err) return res.json(responseModel.getErrorResponse(err, {query: params}));

                    catalogModel.get(appData.namespace, params.storage, params.id, (err, catalog) => {
                        if (err) return res.json(responseModel.getErrorResponse(err, {query: params}));
                        if (!catalog) return res.json(responseModel.getErrorResponse('Not found', {query: params}));

                        res.json(catalogPidResponseModel.getCatalogPidResponse(catalog, params.pid));
                    });
                });
            });
        });
    });
}

function query(req, res) {
    let p = req.swagger.params;
    let params = {
        id: p.id.value,
        storage: p.storage.value
    };
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::get');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));
        catalogModel.get(appData.namespace, params.storage, params.id, (err, catalog) => {
            if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
            if (!catalog) return res.json(responseModel.getErrorResponse('Not found', {query: params}));
            catalogModel.delete(appData.namespace, params.storage, params.id, (err, catalog) => {
                if (err) return res.json(responseModel.getErrorResponse('Internal error', {query: params}));
                res.json(catalogResponseModel.getSuccessResponse({}));
            });
        });
    });
}

function getByKeyContent(req, res) {
    let p = req.swagger.params;
    let params = {
        key: p.key.value,
        storage: p.storage.value,
        content: p.content.value
    };
    let appKey = req.header('x-app-key');
    let appSecret = req.header('x-app-secret');
    console.log("x-app-key: ", appKey);
    console.log("Params: ", params);
    console.log("Method: ", 'catalog::getByKeyContent');

    apiAppModel.get(appKey, appSecret, function (err, appData) {
        if (err) return res.json(responseModel.getErrorResponse('App error', {query: params}));

        catalogKeyModel.getOrCreate(appData.namespace, params.key, (err, catalogKey) => {
            catalogModel.getByKeyContent(appData.namespace, params.storage, catalogKey, params.content, (err, catalog) => {
                if (err) return res.json(responseModel.getErrorResponse(err, {query: params}));
                if (!catalog) return res.json(responseModel.getErrorResponse('Not found', {query: params}));
                res.json(catalogResponseModel.getCatalogResponse(catalog));
            });
        });
    });
}

module.exports = {
    create: create,
    update: update,
    random: random,
    list: list,
    all: all,
    get: get,
    remove: remove,
    link: link,
    query: query,
    getByKeyContent: getByKeyContent
};
