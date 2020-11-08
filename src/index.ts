import { isString } from "lodash";
import * as ConfigUtils from "./Utils/Configuration";
import * as DBUtils from "./Utils/DBUtils";
import Constants from "./Utils/Constants";
import * as BaseManager from "./Managers/Base";
import * as SQLManager from "./Managers/Sequelize";
import * as MongoDBManager from "./Managers/Mongoose";
import * as BSQL from "./Managers/Better-SQL";
import { Err } from "./Utils/Error";

/**
 * Creates a Database with one line. Dialect is automatically chosen from config
 * 
 * Example:
 * 
 * CommonJS
 * ```js
 * const { Keyvify } = require("keyvify");
 * // (or)
 * const Keyvify = require("keyvify").Keyvify;
 * 
 * const Database = Keyvify("database", config);
 * ```
 * 
 * Typescript & ModernJS
 * ```js
 * import { Keyvify } from "keyvify";
 * // (or)
 * import Keyvify from "keyvify";
 * 
 * const Database = Keyvify("database", config);
 * ```
 */
export function Keyvify(name: string, config: ConfigUtils.Config) {
    if (!name) throw new Err(...Constants.NO_DB_NAME);
    if (!isString(name) || !DBUtils.isValidLiteral(name)) throw new Err(...Constants.INVALID_DB_NAME);
    if (!config) throw new Err(...Constants.NO_CONFIG);
    ConfigUtils.checkConfig(config);

    if (ConfigUtils.isSequelizeDialect(config.dialect)) {
        return new SQLManager.SQL(name, config);
    } else if (ConfigUtils.isBetterSQLDialect(config.dialect)) {
        return new BSQL.BetterSQL(name, config);
    } else if (ConfigUtils.isMongoDialect(config.dialect)) {
        return new MongoDBManager.Mongo(name, config);
    } else if (BaseManager.isBaseDBConstructor(config.dialect)) {
        return new config.dialect(name, config);
    } else if (BaseManager.isBaseDBInstance(config.dialect)) {
        return config.dialect;
    } else throw new Err(...Constants.INVALID_DIALECT);
}

export module Keyvify {
    export import SQL = SQLManager.SQL;
    export import MongoDB = MongoDBManager.Mongo;
    export import BetterSQL = BSQL.BetterSQL;
    export import Configuration = ConfigUtils;
    export import Helpers = DBUtils;
}

export const Utils = {
    Constants,
    Error: Err
}

export default Keyvify;