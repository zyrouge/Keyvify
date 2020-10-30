"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.createDatabase = exports.SupportedDialects = void 0;
const sequelize_1 = require("sequelize");
const mongoose_1 = require("mongoose");
const lodash_1 = require("lodash");
const SQLManager = __importStar(require("./Managers/Sequelize"));
const Error_1 = require("./Utils/Error");
const SequelizeDialects = ["mysql", "postgres", "sqlite", "mariadb", "mssql"];
exports.SupportedDialects = [...SequelizeDialects];
function createDatabase(name, config) {
    if (!lodash_1.isString(name))
        throw new Error_1.Err("Invalid Database name", "INVALID_DB_NAME");
    if (!config)
        throw new Error_1.Err("No configuration was passed", "NO_CONFIG");
    if (config.username && !lodash_1.isString(config.username))
        throw new Error_1.Err("Invalid username", "INVALID_USERNAME");
    if (config.password && !lodash_1.isString(config.password))
        throw new Error_1.Err("Invalid password", "INVALID_PASSWORD");
    if (config.database && !lodash_1.isString(config.database))
        throw new Error_1.Err("Invalid database", "INVALID_DATABASE");
    if (config.host && !lodash_1.isString(config.host))
        throw new Error_1.Err("Invalid host", "INVALID_HOST");
    if (config.uri && !lodash_1.isString(config.uri))
        throw new Error_1.Err("Invalid URI", "INVALID_URI");
    if (!config.dialect || !lodash_1.isString(config.dialect) || !exports.SupportedDialects.includes(config.dialect))
        throw new Error_1.Err("Invalid dialect", "INVALID_DIALECT");
    if (config.storage && !lodash_1.isString(config.storage))
        throw new Error_1.Err("Invalid storage", "INVALID_STORAGE");
    if (config.sequelize && !(config.sequelize instanceof sequelize_1.Sequelize))
        throw new Error_1.Err("Invalid sequelize", "INVALID_SEQUELIZE_INSTANCE");
    if (config.mongoose && !(config.mongoose instanceof mongoose_1.Mongoose))
        throw new Error_1.Err("Invalid mongoose", "INVALID_MONGOOSE_INSTANCE");
    if (config.disableCache !== undefined && !lodash_1.isBoolean(config.disableCache))
        throw new Error_1.Err("Invalid cache option", "INVALID_CACHE_OPTION");
    if (config.serializer && !lodash_1.isFunction(config.serializer))
        throw new Error_1.Err("Invalid serializer", "INVALID_SERIALIZER");
    if (config.deserializer && !lodash_1.isFunction(config.deserializer))
        throw new Error_1.Err("Invalid deserializer", "INVALID_DESERIALIZER");
    if (SequelizeDialects.includes(config.dialect)) {
        return new SQLManager.SQL(name, config);
    }
    else {
        throw new Error_1.Err("Invalid Dialect was received", "INVALID_DIALECT");
    }
}
exports.createDatabase = createDatabase;
exports.default = createDatabase;
