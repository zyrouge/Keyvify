import { Sequelize, Dialect as SequelizeDialectsType } from "sequelize";
import { Mongoose } from "mongoose";
import { Err } from "./Error";
import { isString, isNumber, isFunction, isBoolean } from "lodash";

export const SequelizeDialects = ["mysql", "postgres", "sqlite", "mariadb", "mssql"];
export const SupportedDialects = [...SequelizeDialects, "mongodb"];
export type SupportedDialectsType = SequelizeDialectsType | "mongodb";

/**
 * KeyDB Configuration (Common for all Dialects)
 * 
 * Example:
 * 
 * SQLite
 * ```js
 * const config = {
 *      dialect: "sqlite",
 *      storage: "./database.sqlite"
 * }
 * ```
 * 
 * Postgres
 * ```js
 * const config = {
 *      dialect: "postgres",
 *      username: "someuser",
 *      password: "youshallnotpass",
 *      host: "localhost",
 *      port: "8080"
 * }
 * ```
 * 
 * MongoDB
 * ```js
 * const config = {
 *      dialect: "mongodb",
 *      uri: "mongodb://mongodb0.example.com:27017"
 * }
 * ```
 */
export interface Config {

    /**
     * Username of the Database
     */
    username?: string;

    /**
     * Password of the Database
     */
    password?: string;

    /**
     * Database name
     */
    database?: string;

    /**
     * Database's host
     */
    host?: string;

    /**
     * Database's Port
     */
    port?: number;

    /**
     * MongoDB URL (only when using MongoDB)
     */
    uri?: string;

    /**
     * Refer all the Dialects here: {@link SupportedDialectsType}
     */
    dialect: SupportedDialectsType;

    /**
     * Path to Database file (only when using SQLite)
     */
    storage?: string;

    /**
     * Predefined Sequelize instance (only when using SQL)
     */
    sequelize?: Sequelize;

    /**
     * Predefined Sequelize instance (only when using MongoDB)
     */
    mongoose?: Mongoose;

    /**
     * Whether to disable caching
     */
    disableCache?: boolean;

    /**
     * Data serializer
     */
    serializer?: (input: any) => string;

    /**
     * Data deserializer
     */
    deserializer?: (input: string) => any;
}

export function checkConfig(config: Config) {
    if (config.username && !isString(config.username)) throw new Err("Invalid username", "INVALID_USERNAME");
    if (config.password && !isString(config.password)) throw new Err("Invalid password", "INVALID_PASSWORD");
    if (config.database && !isString(config.database)) throw new Err("Invalid database", "INVALID_DATABASE");
    if (config.host && !isString(config.host)) throw new Err("Invalid host", "INVALID_HOST");
    if (config.port !== undefined && !isNumber(config.uri)) throw new Err("Invalid port", "INVALID_PORT");
    if (config.uri && !isString(config.uri)) throw new Err("Invalid URI", "INVALID_URI");
    if (!config.dialect || !isString(config.dialect) || !SupportedDialects.includes(config.dialect)) throw new Err("Invalid dialect", "INVALID_DIALECT");
    if (config.storage && !isString(config.storage)) throw new Err("Invalid storage", "INVALID_STORAGE");
    if (config.sequelize && !(config.sequelize instanceof Sequelize)) throw new Err("Invalid sequelize", "INVALID_SEQUELIZE_INSTANCE");
    if (config.mongoose && !(config.mongoose instanceof Mongoose)) throw new Err("Invalid mongoose", "INVALID_MONGOOSE_INSTANCE");
    if (config.disableCache !== undefined && !isBoolean(config.disableCache)) throw new Err("Invalid cache option", "INVALID_CACHE_OPTION");
    if (config.serializer && !isFunction(config.serializer)) throw new Err("Invalid serializer", "INVALID_SERIALIZER");
    if (config.deserializer && !isFunction(config.deserializer)) throw new Err("Invalid deserializer", "INVALID_DESERIALIZER");
}