import { Config, checkConfig, isSequelizeDialect } from "../Utils/Configuration";
import Constants from "../Utils/Constants";
import { Err } from "../Utils/Error";
import { isArray, isNumber, isObject, isString, isUndefined } from "lodash";
import { getDriver } from "../Utils/Drivers/Sequelize";
import type { Sequelize, Model, ModelCtor, Optional } from "sequelize";
import { BaseCache, BaseDB, isBaseCacheConstructor, isBaseCacheInstance, Memory, Pair } from "./Base";
import { EventEmitter } from "events";
import path from "path";
import { KeyParams, isKeyAndNotation, isValidLiteral, DefSerializer, DefDeserializer, parseKey, getKey, setKey, pullValue, isValidMathOperator, mathValue, Operators } from "../Utils/Utilites";
import fs from "fs-extra";

export interface SQLModelAttr {
    key: string;
    value: string;
}

export interface SQLCreationAttributes extends Optional<SQLModelAttr, "key"> { }

export interface SQLModel
    extends Model<SQLModelAttr, SQLCreationAttributes>,
    SQLModelAttr { }

/**
 * The SQL DB Client
 *
 * Refer all the Events here: {@link BaseDB.on}
 * 
 * Refer all the Methods' description here: {@link BaseDB}
 *
 * Example:
 * ```js
 * const Database = new Keyvify.SQL("database", config);
 * ```
 */
export class SQL extends EventEmitter implements BaseDB {
    public readonly name: string;
    public readonly type: string;
    public connected: boolean;
    public readonly serializer: (input: any) => string;
    public readonly deserializer: (input: string) => any;
    protected readonly sequelize: Sequelize;
    protected model: ModelCtor<SQLModel>;
    protected readonly cache?: BaseCache;
    private SequelizeDriver: ReturnType<typeof getDriver>;

    public constructor(name: string, config: Config) {
        super();

        if (!name) throw new Err(...Constants.NO_DB_NAME);
        if (!isString(name) || !isValidLiteral(name)) throw new Err(...Constants.INVALID_DB_NAME);
        if (!config) throw new Err(...Constants.NO_CONFIG);
        checkConfig(config, false);
        if (!isSequelizeDialect(config.dialect)) throw new Err(...Constants.INVALID_SQL_DIALECT);
        if (config.dialect === "sqlite" && !config.storage) throw new Err(...Constants.NO_SQLITE_STORAGE);

        const storagePath = config.storage && !path.isAbsolute(config.storage)
            ? path.join(process.cwd(), config.storage)
            : undefined;
        if (storagePath) fs.ensureFileSync(storagePath);

        this.name = name;
        this.SequelizeDriver = getDriver();
        this.type = config.dialect instanceof this.SequelizeDriver.Sequelize ? config.dialect.getDialect() : config.dialect;
        this.sequelize = config.dialect instanceof this.SequelizeDriver.Sequelize ? config.dialect : new this.SequelizeDriver.Sequelize({
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
                type: this.SequelizeDriver.DataTypes.STRING
            },
            value: this.SequelizeDriver.DataTypes.TEXT
        });

        if (config.cache !== false) {
            if (isBaseCacheConstructor(config.cache)) this.cache = new config.cache();
            else if (isBaseCacheInstance(config.cache)) this.cache = config.cache;
            else this.cache = new Memory();
        }

        this.connected = false;

        this.serializer = config.serializer || DefSerializer;
        this.deserializer = config.deserializer || DefDeserializer;
    }

    public async connect() {
        await this.sequelize.authenticate();
        await this.sequelize.sync();
        this.connected = true;
        this.emit("connect");
    }

    public async disconnect() {
        await this.sequelize.close();
        this.connected = false;
        this.emit("disconnect");
    }

    public async get(kpar: KeyParams) {
        if (!isKeyAndNotation(kpar)) throw new Err(...Constants.INVALID_PARAMETERS);

        let key: string, dotNot: string | undefined;
        if (isArray(kpar)) [key, dotNot] = kpar;
        else [key, dotNot] = parseKey(kpar);

        const pair = await this.getKey(key);
        if (dotNot) {
            if (!isObject(pair.value)) throw new Err(...Constants.VALUE_NOT_OBJECT);
            pair.value = getKey(pair.value, dotNot);
        }
        this.emit("valueGet", pair);
        return pair;
    }

    protected async getKey(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        let rval = this.cache?.get(key);
        if (isUndefined(rval)) {
            const mod = await this.model.findOne({ where: { key } });
            rval = mod?.get().value;
        }

        return new Pair(key, this.deserializer(`${rval}`));
    }

    public async set(kpar: KeyParams, value: any) {
        if (!isKeyAndNotation(kpar)) throw new Err(...Constants.INVALID_PARAMETERS);

        let key: string, dotNot: string | undefined;
        if (isArray(kpar)) [key, dotNot] = kpar;
        else [key, dotNot] = parseKey(kpar);

        const pair = await this.getKey(key);
        pair.old = pair.value;

        if (dotNot) {
            if (!isObject(pair.old)) throw new Err(...Constants.VALUE_NOT_OBJECT);
            pair.value = setKey(pair.old, dotNot, value);
        } else pair.value = value;

        this.emit(pair.old ? "valueUpdate" : "valueSet", Pair);
        const settedPair = await this.setKey(pair.key, pair.value);
        return { ...pair, ...settedPair } as Pair;
    }

    public async push(kpar: KeyParams, value: any) {
        if (!isKeyAndNotation(kpar)) throw new Err(...Constants.INVALID_PARAMETERS);

        let key: string, dotNot: string | undefined;
        if (isArray(kpar)) [key, dotNot] = kpar;
        else [key, dotNot] = parseKey(kpar);

        const pair = await this.getKey(key);
        pair.old = pair.value;

        if (dotNot) {
            if (isUndefined(pair.old)) pair.old = {};
            if (!isObject(pair.old)) throw new Err(...Constants.VALUE_NOT_OBJECT);
            const valAr = getKey(pair.old, dotNot, []);
            valAr.push(value);
            pair.value = setKey(pair.old, dotNot, valAr);
        } else {
            if (isUndefined(pair.old)) pair.old = [];
            pair.value = [...pair.old, value];
        }

        const npair = await this.setKey(pair.key, pair.value);
        if (pair.old) npair.old = pair.old;
        this.emit(pair.old ? "valueUpdate" : "valueSet", npair);
        return npair;
    }

    public async pull(kpar: KeyParams, value: any) {
        if (!isKeyAndNotation(kpar)) throw new Err(...Constants.INVALID_PARAMETERS);

        let key: string, dotNot: string | undefined;
        if (isArray(kpar)) [key, dotNot] = kpar;
        else [key, dotNot] = parseKey(kpar);

        const pair = await this.getKey(key);
        pair.old = pair.value;

        if (dotNot) {
            if (isUndefined(pair.old)) pair.old = {};
            if (!isObject(pair.old)) throw new Err(...Constants.VALUE_NOT_OBJECT);
            let valAr = getKey(pair.old, dotNot, []);
            valAr = pullValue(valAr, value);
            pair.value = setKey(pair.old, dotNot, valAr);
        } else {
            if (isUndefined(pair.old)) pair.old = [];
            pair.value = pullValue(pair.old, value);
        }

        const npair = await this.setKey(pair.key, pair.value);
        if (pair.old) npair.old = pair.old;
        this.emit(pair.old ? "valueUpdate" : "valueSet", npair);
        return npair;
    }

    public add(kpar: KeyParams, value: number) {
        return this.math(kpar, "+", value);
    }

    public subtract(kpar: KeyParams, value: number) {
        return this.math(kpar, "-", value);
    }

    public multiply(kpar: KeyParams, value: number) {
        return this.math(kpar, "*", value);
    }

    public divide(kpar: KeyParams, value: number) {
        return this.math(kpar, "/", value);
    }

    public modulo(kpar: KeyParams, value: number) {
        return this.math(kpar, "%", value);
    }

    public exponent(kpar: KeyParams, value: number) {
        return this.math(kpar, "**", value);
    }

    public async math(kpar: KeyParams, operator: Operators, value: number) {
        if (!isKeyAndNotation(kpar)) throw new Err(...Constants.INVALID_PARAMETERS);
        if (!isValidMathOperator(operator)) throw new Err(...Constants.INVALID_PARAMETERS);
        if (!isNumber(value)) throw new Err(...Constants.INVALID_PARAMETERS);

        let key: string, dotNot: string | undefined;
        if (isArray(kpar)) [key, dotNot] = kpar;
        else [key, dotNot] = parseKey(kpar);

        const pair = await this.getKey(key);
        pair.old = pair.value;

        if (dotNot) {
            if (isUndefined(pair.old)) pair.old = {};
            if (!isObject(pair.old)) throw new Err(...Constants.VALUE_NOT_OBJECT);
            let valAr = getKey(pair.old, dotNot, 0);
            valAr = mathValue(valAr, value, operator);
            pair.value = setKey(pair.old, dotNot, valAr);
        } else {
            if (isUndefined(pair.old)) pair.old = 0;
            pair.value = mathValue(pair.old, value, operator);
        }

        const npair = await this.setKey(pair.key, pair.value);
        if (pair.old) npair.old = pair.old;
        this.emit(pair.old ? "valueUpdate" : "valueSet", npair);
        return npair;
    }

    protected async setKey(key: string, value: any) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);
        if (isUndefined(value)) throw new Err(...Constants.NO_VALUE);

        const serval = this.serializer(value);
        let oldVal: any;

        const [mod, isCreated] = await this.model.findOrCreate({ where: { key } });
        if (!isCreated) oldVal = this.deserializer(`${mod.get().value}`);
        await this.model.update({ value: serval }, { where: { key } });
        this.cache?.set(key, serval);

        const pair = new Pair(key, this.deserializer(serval));
        pair.old = oldVal;
        return pair;
    }

    public async delete(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        const totalDeleted = await this.model.destroy({
            where: { key }
        });
        this.cache?.delete(key);
        this.emit("valueDelete", key, totalDeleted);
        return totalDeleted;
    }

    public async truncate() {
        const totalDeleted = await this.model.destroy({ truncate: true });
        this.emit("truncate", totalDeleted);
        return totalDeleted;
    }

    public async all() {
        const allMods = await this.model.findAll();
        this.cache?.empty();
        const allKeys = allMods.map(m => {
            const mod = m.get();
            this.cache?.set(mod.key, mod.value);
            return new Pair(mod.key, this.deserializer(`${mod.value}`));
        });

        this.emit("valueFetch", allKeys);
        return allKeys;
    }

    public empty() {
        this.cache?.empty();
    }

    public entries() {
        return this.cache?.entries() || [];
    }
}