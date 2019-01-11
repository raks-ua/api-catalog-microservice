'use strict';

let ResponseModel = require('./response_model');
let Catalog = require('../../entity/catalog');

class CatalogResponseModel extends ResponseModel {

    static getCatalog(catalog) {
        return {
            id: catalog.getId(),
            pids: catalog.getParent() ? catalog.getParent() : null,
            key: {
                id: catalog.getCatalogKey().getId(),
                name: catalog.getCatalogKey().getName(),
                created: catalog.getCatalogKey().getCreated()
            },
            data: catalog.getData(),
            content: catalog.getContent(),
            storage: catalog.getStorage(),
            created: catalog.getCreated(),
            updated: catalog.getUpdated(),
            objType: 'Catalog'
        };
    }

    /**
     *
     * @param catalog {Catalog}
     */
    getCatalogResponse(catalog) {
        let data = {
            data: CatalogResponseModel.getCatalog(catalog)
        };
        return this.getSuccessResponse(data);
    }

    /**
     *
     * @param ids Array
     */
    getCatalogIdsResponse(ids) {
        let data = {
            data: {
                ids: ids
            }
        };
        return this.getSuccessResponse(data);
    }

    /**
     *
     * @param catalogs {Array<Catalog>}
     */
    getCatalogsResponse(catalogs) {
        let data = {
            data: {
                catalogs: []
            }
        };
        for(let i = 0; i < catalogs.length; i++){
            data.data.catalogs.push(CatalogResponseModel.getCatalog(catalogs[i]));
        }

        return this.getSuccessResponse(data);
    }
}

module.exports = CatalogResponseModel;