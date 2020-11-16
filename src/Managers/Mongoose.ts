import { Config, checkConfig, isMongoDialect } from "../Utils/Configuration";
import { isObject, isArray, isString, isUndefined, isNumber } from "lodash";
import Mongoose from "mongoose";
import { BaseCache, BaseDB, isBaseCacheConstructor, isBaseCacheInstance, Memory, Pair } from "./Base";
import { EventEmitter } from "events";
import { Err } from "../Utils/Error";
import Constants from "../Utils/Constants";
import { KeyParams, isKeyAndNotation, isValidLiteral, DefSerializer, DefDeserializer, parseKey, getKey, setKey, pullValue, isValidMathOperator, mathValue, Operators } from "../Utils/Utilites";

export interface MongooseModel extends Mongoose.Document {
    key: string;
    value: string;
}

/**
 * The Mongo DB Client
 * 
 * Refer all the Events here: {@link BaseDB.on}
 * Refer all the Methods' description here: {@link BaseDB}
 * 
 * Example:
 * ```js
 * const Database = new Keyvify.Mongo("database", config);
 * ```
 */
export class Mongo extends EventEmitter implements BaseDB {
    public readonly name: string;
    public readonly type = "mongodb";
    public connected: boolean;
    public readonly serializer: (input: any) => string;
    public readonly deserializer: (input: string) => any;
    protected schema: Mongoose.Schema;
    protected model: Mongoose.Model<MongooseModel>;
    protected readonly cache?: BaseCache;
    private readonly uri: string;

    public constructor(name: string, config: Config) {
        super();

        if (!name) throw new Err(...Constants.NO_DB_NAME);
        if (!isString(name) || !isValidLiteral(name)) throw new Err(...Constants.INVALID_DB_NAME);
        if (!config) throw new Err(...Constants.NO_CONFIG);
        checkConfig(config, false);
        if (config.dialect && !isMongoDialect(config.dialect)) throw new Err(...Constants.INVALID_DIALECT);

        this.name = name;

        if (!config.uri) throw new Err(...Constants.MISSING_MONGODB_URI);
        this.uri = config.uri;

        this.schema = new Mongoose.Schema({
            key: {
                type: String,
                required: true,
                unique: true
            },
            value: {
                type: String,
                required: false
            }
        });

        this.model = Mongoose.model<MongooseModel>(this.name, this.schema);

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
        await Mongoose.connect(this.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        this.connected = true;
        this.emit("connect");
    }

    public async disconnect() {
        Mongoose.disconnect();
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
            const mod = await this.model.findOne({ key });
            rval = mod?.value;
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

        let mod = await this.model.findOne({ key });
        if (mod) {
            oldVal = this.deserializer(`${mod.value}`);
        } else mod = new this.model({ key });
        mod.value = serval;
        await mod.save();
        this.cache?.set(key, serval);

        const pair = new Pair(key, this.deserializer(serval));
        if (oldVal) pair.old = oldVal;
        return pair;
    }

    public async delete(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        const totalDeleted = (await this.model.deleteOne({ key }))?.deletedCount || 0;
        this.cache?.delete(key);
        this.emit("valueDelete", key, totalDeleted);
        return totalDeleted;
    }

    public async truncate() {
        const { deletedCount } = await this.model.deleteMany({});
        this.emit("truncate", deletedCount || 0);
        return deletedCount || 0;
    }

    public async all() {
        const allMods = await this.model.find();
        this.cache?.empty();
        const allKeys = allMods.map(({ key, value: rvalue }) => {
            this.cache?.set(key, rvalue);
            return new Pair(key, this.deserializer(`${rvalue}`))
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
