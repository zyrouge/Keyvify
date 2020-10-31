import { Config, checkConfig, SequelizeDialects } from "../Utils/Configuration";
import { Err } from "../Utils/Error";
import { isString } from "lodash";
import { Sequelize, Model, ModelCtor, DataTypes, Optional, Dialect } from "sequelize";
import { BaseDB, Memory } from "./Base";
import * as path from "path";
import * as DataParser from "../Utils/DataParser";

export interface SQLModelAttr {
    key: string;
    value: string;
}

interface SQLCreationAttributes extends Optional<SQLModelAttr, "key"> { }

export interface SQLModel
    extends Model<SQLModelAttr, SQLCreationAttributes>,
    SQLModelAttr { }

/**
* The SQL DB Client
*
* Example:
* ```js
* const Database = new KeyDB.SQL("database", config);
* ```
*/
export class SQL implements BaseDB {
    name: string;
    type: string;
    sequelize: Sequelize;
    model: ModelCtor<SQLModel>;

    cache?: Memory;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    constructor(name: string, config: Config) {
        if (!isString(name)) throw new Err("Invalid Database name", "INVALID_DB_NAME");
        if (!config) throw new Err("No configuration was passed", "NO_CONFIG");
        checkConfig(config);

        if (!isSequelizeDialect(config.dialect)) throw new Err("Invalid SQL Dialect", "INVALID_SQL_DIALECT");
        if (config.dialect === "sqlite" && !config.storage) throw new Err("No storage path was passed", "NO_SQLITE_STORAGE");

        const storagePath = config.storage && !path.isAbsolute(config.storage)
            ? path.join(process.cwd(), config.storage)
            : undefined;

        this.name = name;
        this.type = config.dialect;
        this.sequelize = config.sequelize || new Sequelize({
            database: config.database,
            username: config.username,
            password: config.password,
            host: config.host,
            port: config.port,
            dialect: config.dialect,
            storage: storagePath
                ? `${storagePath}${storagePath.endsWith(".sqlite") ? "" : ".sqlite"}`
                : undefined
        });

        this.model = this.sequelize.define<SQLModel>(this.name, {
            key: {
                primaryKey: true,
                type: DataTypes.STRING
            },
            value: {
                type: DataTypes.STRING,
                allowNull: false
            }
        });

        if (config.disableCache !== true) {
            this.cache = new Memory();
        }
        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }

    async connect() {
        await this.sequelize.authenticate();
        await this.sequelize.sync();
    }

    async disconnect() {
        await this.sequelize.close();
    }

    async get(key: string) {
        const cachev = this.cache?.get(key);
        const mod = cachev || (await this.model.findByPk(key))?.getDataValue("value") || undefined;

        return mod ? this.deserializer(mod) : undefined;
    }

    async set(key: string, value: any) {
        const obj = { key, value: this.serializer(value) };
        await this.model.findOrCreate({ where: obj });
        this.cache?.set(obj.key, obj.value);

        return this.deserializer(obj.value);
    }

    async delete(key: string) {
        const totalDeleted = await this.model.destroy({
            where: { key }
        });
        this.cache?.delete(key);

        return totalDeleted || 0;
    }

    async all() {
        const allMods = await this.model.findAll();
        const allKeys = allMods.map(m => {
            const key = m.getDataValue("key");
            const rvalue = m.getDataValue("value");
            const value = rvalue ? this.deserializer(rvalue) : undefined;
            return { key, value }
        });

        if (this.cache) {
            allKeys.forEach(({ key, value }) => this.cache?.set(key, value));
            const cachedKeys = await this.all();
            cachedKeys.forEach(({ key }) => this.cache?.delete(key));
        }

        return allKeys;
    }

    entries() {
        return this.cache?.all() || [];
    }
}

function isSequelizeDialect(dialect: string): dialect is Dialect {
    return SequelizeDialects.includes(dialect);
}