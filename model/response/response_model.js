'use strict';

let self;

class ResponseModel {

    constructor() {
        self = this;
    }

    /**
     *
     * @param error
     * @param data
     * @returns {*}
     */
    getErrorResponse(error, data = {}){
        let response = Object.assign({}, data);
        response.ok = false;
        response.message = error;
        return response;
    }

    /**
     *
     * @param data
     * @returns {{} & {}}
     */
    getSuccessResponse(data = {}){
        let response = Object.assign({}, data);
        response.ok = true;
        response.message = '';
        return response;
    }
}

module.exports = ResponseModel;