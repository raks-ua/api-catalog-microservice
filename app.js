'use strict';

let SwaggerExpress = require('swagger-express-mw');
let app = require('express')();
let graphqlHTTP = require('express-graphql');
const graphqlTools = require('graphql-tools');
let query = require('./query');


let conf = require('config');
let appModel = require('./model/app_model.js');
let sql = require('./model/sql_model');
let sqlMul = require('./model/sql_multiple_model');
let dbModel = require('./model/db_model');

let config = {
    appRoot: __dirname, // required config
    swaggerSecurityHandlers: {
        appCredentials: function (req, authOrSecDef, scopesOrApiKey, cb) {
            checkAuth(req, cb);
        }
    }
};

function checkAuth(req, callback){
    appModel.check(req.headers['x-app-key'], req.headers['x-app-secret'], (err, app) => {
        if (err || !app) {
            return callback(new Error('access denied!'));
        }
        callback();
    });
}

function authMiddleware(req, res, next) {
    checkAuth(req, err => {
        if(!err) return next();
        throw err;
    });
}

SwaggerExpress.create(config, function (err, swaggerExpress) {
    if (err) {
        throw err;
    }

    connect((error) => {
        if (error) {
            console.log('[FATAL ERROR]', err);
            throw error.stack;
        }

        dbModel.listen();

        console.log('[STARTED]');

        // install middleware
        swaggerExpress.register(app);
        app.use((err, req, res, next) => {
            console.log('ERR request', req.swagger && req.swagger.params, err);
            if (err.status) res.status(err.status);
            res.send({ok: false, message: err.message});
        });

        app.use(authMiddleware);
        app.use('/api/query', graphqlHTTP({
            schema: graphqlTools.makeExecutableSchema({
                typeDefs: query.schema,
                resolvers: query.resolverMap
            }),
            rootValue: query.root,
            graphiql: true,
        }));

        app.listen(conf.port);
    });
});

function connect(callback) {
    let p = [];
    p.push(new Promise((resolve, reject) => {
        sql.connect(function (error) {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    }));

    p.push(new Promise((resolve, reject) => {
        sqlMul.connect(function (error) {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    }));

    Promise.all(p).then(() => {
        dbModel.initTablesMain((err) => {
            if(err) return callback && callback(err);
            callback && callback();
        });
    }).catch((err) => {
        callback && callback(err);
    });
}

module.exports = app; // for testing