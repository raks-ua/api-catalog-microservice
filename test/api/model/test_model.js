let config = require('config');
let request = require('supertest');

class TestModel {

    constructor() {
        this.request = request(config.APP_TEST_URL);
    }

    getRequest() {
        return this.request;
    }

    /**
     *
     * @param request
     */
    setAuthHeaders(request) {
        return request.set('X-APP-KEY', config.APP_TEST_KEY)
            .set('X-APP-SECRET', config.APP_TEST_SECRET);
    }

    getApiBasic(path) {
        return this.request.get('/api/' + path)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
    }

    getSuccessApiBasic(path) {
        return this.getApiBasic(path)
            .expect(200);
    }

    getSuccessApiAuthBasic(path) {
        return this.setAuthHeaders(this.getSuccessApiBasic(path));
    }

    /**
     *
     * @param path
     * @param fields
     * @returns {Test}
     */
    postApiBasic(path, fields) {
        return this.request.post('/api/' + path)
            .send(fields)
            .set('Accept',  'application/json/')
            .expect('Content-Type', /json/);
    }

    /**
     *
     * @param path
     * @param fields
     * @returns {Test}
     */
    postSuccessApiBasic(path, fields) {
        return this.postApiBasic(path, fields)
            .expect(200);
    }

    /**
     *
     * @param path
     * @param fields
     * @returns {*}
     */
    postSuccessApiAuthBasic(path, fields) {
        return this.setAuthHeaders(this.postSuccessApiBasic(path, fields));
    }

    /**
     *
     * @param path
     * @param fields
     * @returns {Test}
     */
    deleteApiBasic(path) {
        return this.request.delete('/api/' + path)
            .set('Accept',  'application/json/')
            .expect('Content-Type', /json/);
    }

    /**
     *
     * @param path
     * @param fields
     * @returns {Test}
     */
    deleteSuccessApiBasic(path) {
        return this.deleteApiBasic(path)
            .expect(200);
    }

    /**
     *
     * @param path
     * @param fields
     * @returns {*}
     */
    deleteSuccessApiAuthBasic(path) {
        return this.setAuthHeaders(this.deleteSuccessApiBasic(path));
    }

}

module.exports = new TestModel();