import { Config, checkConfig, isMongoDialect } from "../Utils/Configuration";
import { isObject, isArray, isString, isUndefined } from "lodash";
import Mongoose from "mongoose";
import { BaseCache, BaseDB, isBaseCacheConstructor, isBaseCacheInstance, Memory } from "./Base";
import { EventEmitter } from "events";
import * as DataParser from "../Utils/DataParser";
import { Err } from "../Utils/Error";
import Constants from "../Utils/Constants";
import { isKeyNdNotation, KeyParams, DotNotations, isValidLiteral } from "../Utils/DBUtils";

export interface MongooseModel extends Mongoose.Document {
    key: string;
    value: string;
}

/**
 * The Mongo DB Client
 * 
 * Refer all the Events here: {@link BaseDB.on}
 * 
 * Example:
 * ```js
 * const Database = new Keyvify.Mongo("database", config);
 * ```
 */
export class Mongo extends EventEmitter implements BaseDB {
    name: string;
    type = "mongodb";
    uri: string;
    schema: Mongoose.Schema;
    model: Mongoose.Model<MongooseModel>;

    cache?: BaseCache;
    connected: boolean;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    constructor(name: string, config: Config) {
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

        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }

    async connect() {
        await Mongoose.connect(this.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        this.connected = true;
        this.emit("connect");
    }

    async disconnect() {
        Mongoose.disconnect();
        this.connected = false;
        this.emit("disconnect");
    }

    async get(key: KeyParams) {
        if (!isKeyNdNotation(key)) throw new Err(...Constants.INVALID_PARAMETERS);
        if (isString(key)) return this.getKey(key);
        if (isArray(key)) {
            const [vKey, dotNot] = key;
            const val = await this.getKey(vKey);
            if (isObject(val)) return DotNotations.getKey(val, dotNot);
            else throw new Err(...Constants.VALUE_NOT_OBJECT);
        }
    }

    async getKey(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        let rval = this.cache?.get(key);
        if (isUndefined(rval)) {
            const mod = await this.model.findOne({ key });
            rval = mod?.value;
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
            const newVal = DotNotations.setKey(val, dotNot, value);
            return this.setKey(vKey, newVal);
        }
    }

    async setKey(key: string, value: any) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);
        if (!value) throw new Err(...Constants.NO_VALUE);

        const serval = this.serializer(value);
        let oldVal: any;

        let mod = await this.model.findOne({ key });
        if (mod) {
            const __v = mod.value;
            oldVal = this.deserializer(`${__v}`);
        } else mod = new this.model({ key });
        mod.update({ value: serval });
        await mod.save();
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

        const totalDeleted = (await this.model.deleteOne({ key }))?.deletedCount || 0;
        this.cache?.delete(key);
        this.emit("valueDelete", key, totalDeleted);
        return totalDeleted;
    }

    async truncate() {
        const { deletedCount } = await this.model.deleteMany({});
        this.emit("truncate", deletedCount || 0);
        return deletedCount || 0;
    }

    async all() {
        const allMods = await this.model.find();
        this.cache?.empty();
        const allKeys = allMods.map(m => {
            const key = m.key;
            const rvalue = m.value;
            this.cache?.set(key, m.value);
            const value = rvalue ? this.deserializer(rvalue) : undefined;
            return { key, value }
        });

        this.emit("valueFetch", allKeys);
        return allKeys;
    }

    entries() {
        return this.cache?.entries() || [];
    }
}
