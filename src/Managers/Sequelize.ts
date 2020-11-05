import { Config, checkConfig, isSequelizeDialect } from "../Utils/Configuration";
import Constants from "../Utils/Constants";
import { Err } from "../Utils/Error";
import { isArray, isObject, isString, isUndefined } from "lodash";
import { Sequelize, Model, ModelCtor, DataTypes, Optional } from "sequelize";
import { BaseCache, BaseDB, isBaseCacheConstructor, isBaseCacheInstance, Memory } from "./Base";
import { EventEmitter } from "events";
import path from "path";
import * as DataParser from "../Utils/DataParser";
import { isKeyNdNotation, KeyParams, DotNotations } from "../Utils/DBUtils";

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
 * const Database = new Keyvify.SQL("database", config);
 * ```
 */
export class SQL extends EventEmitter implements BaseDB {
    name: string;
    type: string;
    sequelize: Sequelize;
    model: ModelCtor<SQLModel>;

    cache?: BaseCache;
    connected: boolean;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    constructor(name: string, config: Config) {
        super();

        if (!name) throw new Err(...Constants.NO_DB_NAME);
        if (!isString(name)) throw new Err(...Constants.INVALID_DB_NAME);
        if (!config) throw new Err(...Constants.NO_CONFIG);
        checkConfig(config, false);
        if (!isSequelizeDialect(config.dialect)) throw new Err(...Constants.INVALID_SQL_DIALECT);
        if (config.dialect === "sqlite" && !config.storage) throw new Err(...Constants.NO_SQLITE_STORAGE);

        const storagePath = config.storage && !path.isAbsolute(config.storage)
            ? path.join(process.cwd(), config.storage)
            : undefined;

        this.name = name;
        this.type = config.dialect instanceof Sequelize ? config.dialect.getDialect() : config.dialect;
        this.sequelize = config.dialect instanceof Sequelize ? config.dialect : new Sequelize({
            database: config.database,
            username: config.username,
            password: config.password,
            host: config.host,
            port: config.port,
            dialect: config.dialect,
            storage: storagePath
                ? `${storagePath}${storagePath.endsWith(".sqlite") ? "" : ".sqlite"}`
                : undefined,
            logging: false
        });

        this.model = this.sequelize.define<SQLModel>(this.name, {
            key: {
                primaryKey: true,
                type: DataTypes.STRING
            },
            value: DataTypes.TEXT
        });

        if (!isUndefined(config.cache) && config.cache !== false) {
            if (isBaseCacheConstructor(config.cache)) this.cache = new config.cache();
            else if (isBaseCacheInstance(config.cache)) this.cache = config.cache;
            else this.cache = new Memory();
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

    async get(key: KeyParams) {
        if (!isKeyNdNotation(key)) throw new Err(...Constants.INVALID_PARAMETERS);
        if (isString(key)) return this.getKey(key);
        if (isArray(key)) {
            const [vKey, dotNot] = key;
            const val = await this.getKey(vKey);
            if (isObject(val)) return DotNotations.get(val, dotNot);
            else throw new Err(...Constants.VALUE_NOT_OBJECT);
        }
    }

    async getKey(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        let rval = this.cache?.get(key);
        if (isUndefined(rval)) {
            const mod = await this.model.findOne({ where: { key } });
            rval = mod?.get().value;
        }

        const val = this.deserializer(`${rval}`);
        this.emit("valueGet", { key, value: val });
        return val;
    }

    async set(key: KeyParams, value: any) {
        if (!isKeyNdNotation(key)) throw new Err(...Constants.INVALID_PARAMETERS);
        if (isString(key)) return this.setKey(key, value);
        if (isArray(key)) {
            const [vKey, dotNot] = key;
            const val = await this.getKey(vKey);
            if (!isObject(val)) throw new Err(...Constants.VALUE_NOT_OBJECT);
            const newVal = DotNotations.set(val, dotNot, value);
            return this.setKey(vKey, newVal);
        }
    }

    async setKey(key: string, value: any) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);
        if (!value) throw new Err(...Constants.NO_VALUE);

        const serval = this.serializer(value);
        let oldVal: any;

        const [mod, isCreated] = await this.model.findOrCreate({ where: { key } });
        if (!isCreated) {
            const __v = mod.get().value;
            oldVal = __v ? this.deserializer(__v) : undefined;
        }

        await this.model.update({ value: serval }, { where: { key } });
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
        this.cache?.empty();
        const allKeys = allMods.map(m => {
            const mod = m.get();
            this.cache?.set(mod.key, mod.value);
            const value = this.deserializer(`${mod.value}`);
            return { key: mod.key, value }
        });

        this.emit("valueFetch", allKeys);
        return allKeys;
    }

    entries() {
        return this.cache?.entries() || [];
    }
}