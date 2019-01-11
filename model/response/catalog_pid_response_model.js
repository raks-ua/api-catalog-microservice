'use strict';

let ResponseModel = require('./response_model');
let CatalogResponseModel = require('./catalog_response_model');

class CatalogPidResponseModel extends ResponseModel {

    /**
     *
     * @param catalog
     * @param pid
     * @return {{}&{}}
     */
    getCatalogPidResponse(catalog, pid) {
        let data = {
            data:{
                id: catalog.getId(),
                pid: pid,
                storage: catalog.getStorage(),
                catalog: CatalogResponseModel.getCatalog(catalog)
            }
        };
        return this.getSuccessResponse(data);
    }
}

module.exports = CatalogPidResponseModel;