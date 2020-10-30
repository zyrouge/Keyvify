import { Sequelize, Dialect as SequelizeDialectsType } from "sequelize";
import { Mongoose } from "mongoose";
import { isString, isFunction, isBoolean } from "lodash";
import * as SQLManager from "./Managers/Sequelize";
import { Err } from "./Utils/Error";

const SequelizeDialects = ["mysql", "postgres", "sqlite", "mariadb", "mssql"];
export const SupportedDialects = [...SequelizeDialects];
export type SupportedDialectsType = SequelizeDialectsType;

export interface Config {
    username?: string;
    password?: string;
    database?: string;
    host?: string;
    uri?: string;
    dialect: SupportedDialectsType;
    storage?: string;
    sequelize?: Sequelize;
    mongoose: Mongoose;
    disableCache?: boolean;
    serializer?: (input: any) => string;
    deserializer?: (input: string) => any;
}

export function createDatabase(name: string, config: Config) {
    if (!isString(name)) throw new Err("Invalid Database name", "INVALID_DB_NAME");
    if (!config) throw new Err("No configuration was passed", "NO_CONFIG");

    if (config.username && !isString(config.username)) throw new Err("Invalid username", "INVALID_USERNAME");
    if (config.password && !isString(config.password)) throw new Err("Invalid password", "INVALID_PASSWORD");
    if (config.database && !isString(config.database)) throw new Err("Invalid database", "INVALID_DATABASE");
    if (config.host && !isString(config.host)) throw new Err("Invalid host", "INVALID_HOST");
    if (config.uri && !isString(config.uri)) throw new Err("Invalid URI", "INVALID_URI");
    if (!config.dialect || !isString(config.dialect) || !SupportedDialects.includes(config.dialect)) throw new Err("Invalid dialect", "INVALID_DIALECT");
    if (config.storage && !isString(config.storage)) throw new Err("Invalid storage", "INVALID_STORAGE");
    if (config.sequelize && !(config.sequelize instanceof Sequelize)) throw new Err("Invalid sequelize", "INVALID_SEQUELIZE_INSTANCE");
    if (config.mongoose && !(config.mongoose instanceof Mongoose)) throw new Err("Invalid mongoose", "INVALID_MONGOOSE_INSTANCE");
    if (config.disableCache !== undefined && !isBoolean(config.disableCache)) throw new Err("Invalid cache option", "INVALID_CACHE_OPTION");
    if (config.serializer && !isFunction(config.serializer)) throw new Err("Invalid serializer", "INVALID_SERIALIZER");
    if (config.deserializer && !isFunction(config.deserializer)) throw new Err("Invalid deserializer", "INVALID_DESERIALIZER");

    if (SequelizeDialects.includes(config.dialect)) {
        return new SQLManager.SQL(name, config);
    } else {
        throw new Err("Invalid Dialect was received", "INVALID_DIALECT");
    }
}

export { createDatabase as default };