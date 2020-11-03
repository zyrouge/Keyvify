import { Config, checkConfig, isSequelizeDialect } from "../Utils/Configuration";
import Constants from "../Utils/Constants";
import { Err } from "../Utils/Error";
import { isString } from "lodash";
import { Sequelize, Model, ModelCtor, DataTypes, Optional } from "sequelize";
import { BaseDB, Memory } from "./Base";
import { EventEmitter } from "events";
import path from "path";
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
 * Refer all the Events here: {@link BaseDB.on}
 *
 * Example:
 * ```js
 * const Database = new KVDB.SQL("database", config);
 * ```
 */
export class SQL extends EventEmitter implements BaseDB {
    name: string;
    type: string;
    sequelize: Sequelize;
    model: ModelCtor<SQLModel>;

    cache?: Memory;
    connected: boolean;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    constructor(name: string, config: Config) {
        super();

        if (!name) throw new Err(...Constants.NO_DB_NAME);
        if (!isString(name)) throw new Err(...Constants.INVALID_DB_NAME);
        if (!config) throw new Err(...Constants.NO_CONFIG);
        checkConfig(config);

        if (!isSequelizeDialect(config.dialect)) throw new Err(...Constants.INVALID_SQL_DIALECT);
        if (config.dialect === "sqlite" && !config.storage) throw new Err(...Constants.NO_SQLITE_STORAGE);

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
                type: DataTypes.TEXT,
                allowNull: false
            }
        });

        if (config.disableCache !== true) {
            this.cache = new Memory();
        }

        this.connected = false;

        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }

    async connect() {
        await this.sequelize.authenticate();
        await this.sequelize.sync();
        this.connected = true;
        this.emit("connect");
    }

    async disconnect() {
        await this.sequelize.close();
        this.emit("disconnect");
    }

    async get(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        const cachev = this.cache?.get(key);
        const mod = cachev || (await this.model.findByPk(key))?.getDataValue("value") || undefined;

        const val = mod ? this.deserializer(mod) : undefined;
        this.emit("valueGet", { key, value: val });
        return val;
    }

    async set(key: string, value: any) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);
        if (!value) throw new Err(...Constants.NO_VALUE);

        const serval = this.serializer(value);
        let oldVal: any;

        const [mod, isCreated] = await this.model.findOrCreate({ where: { key } });
        if (!isCreated) {
            const __v = mod.getDataValue("value");
            oldVal = __v ? this.deserializer(__v) : undefined;
            await mod.update("value", serval);
        }

        this.cache?.set(key, serval);
        const val = this.deserializer(serval);
        oldVal
            ? this.emit("valueUpdate", { key, value: oldVal }, { key, value: val })
            : this.emit("valueSet", { key, value: val });
        return val;
    }

    async delete(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        const totalDeleted = await this.model.destroy({
            where: { key }
        });
        this.cache?.delete(key);
        this.emit("valueDelete", key, totalDeleted);
        return totalDeleted;
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

        this.emit("valueFetch", allKeys);
        return allKeys;
    }

    entries() {
        return this.cache?.all() || [];
    }
}