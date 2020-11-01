import { isString } from "lodash";
import * as ConfigUtils from "./Utils/Configuration";
import * as SQLManager from "./Managers/Sequelize";
import * as MongoDBManager from "./Managers/Mongoose";
import { Err } from "./Utils/Error";

/**
 * Creates a Database with one line. Dialect is automatically chosen from config
 * 
 * Example:
 * 
 * CommonJS
 * ```js
 * const { KeyDB } = require("key.db");
 * // (or)
 * const KeyDB = require("key.db").KeyDB;
 * 
 * const Database = KeyDB("database", config);
 * ```
 * 
 * Typescript & ModernJS
 * ```js
 * import { KeyDB } from "key.db";
 * // (or)
 * import KeyDB from "key.db";
 * 
 * const Database = KeyDB("database", config);
 * ```
 */
export function KeyDB(name: string, config: ConfigUtils.Config) {
    if (!isString(name)) throw new Err("Invalid Database name", "INVALID_DB_NAME");
    if (!config) throw new Err("No configuration was passed", "NO_CONFIG");
    ConfigUtils.checkConfig(config);

    if (ConfigUtils.isSequelizeDialect(config.dialect)) {
        return new SQLManager.SQL(name, config);
    } else if (config.dialect === "mongodb") {
        return new MongoDBManager.Mongo(name, config);
    } else throw new Err("Invalid dialect", "INVALID_DIALECT");
}

export module KeyDB {
    export import SQL = SQLManager.SQL;
    export import MongoDB = MongoDBManager.Mongo;
    export import Utils = ConfigUtils;
}

export default KeyDB;