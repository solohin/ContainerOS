import dotenv from 'dotenv';
dotenv.config()

const config = {
    ENV: process.env.ENV || 'dev',
    CLUSTER_API_PORT: 8080,
    MAX_APP_SCALING: 10,
    IS_TEST: undefined,
    IS_DEV: undefined,
    IS_PROD: undefined,
    CONSUL_HOST: undefined,
    REGISTRY_HOST: undefined,
    REGISTRY_STORAGE_S3_ACCESSKEY: process.env.REGISTRY_STORAGE_S3_ACCESSKEY,
    REGISTRY_STORAGE_S3_SECRETKEY: process.env.REGISTRY_STORAGE_S3_SECRETKEY,
    REGISTRY_STORAGE_S3_BUCKET: process.env.REGISTRY_STORAGE_S3_BUCKET,
    REGISTRY_STORAGE_S3_REGIONENDPOINT: process.env.REGISTRY_STORAGE_S3_REGIONENDPOINT,
    REGISTRY_STORAGE_S3_REGION: process.env.REGISTRY_STORAGE_S3_REGION,
}

if (process.env.ENV === "production") {
    config.IS_TEST = false
    config.IS_DEV = false
    config.IS_PROD = true
} else if (process.env.ENV === "test") { //TODO adapt for mocha
    config.IS_TEST = true
    config.IS_DEV = false
    config.IS_PROD = false
} else {
    config.IS_TEST = false
    config.IS_DEV = true
    config.IS_PROD = false
}

if (config.IS_DEV) {
    config.CONSUL_HOST = 'localhost'
} else {
    config.CONSUL_HOST = 'consul1'
}

if (config.IS_DEV) {
    config.REGISTRY_HOST = 'localhost'
} else {
    config.REGISTRY_HOST = 'registry'
}

var proxy = new Proxy(
    config,
    {
        get: function (obj, name) {
            if (typeof obj[name] === "undefined") {
                const logger = require("./lib/logger").default
                logger.fatal("undefined config value: " + String(name) + ". Avalable values: ", Object.keys(obj).join(", "))
                process.exit(1)
            }

            return obj[name];
        },
    }
);

export default proxy
