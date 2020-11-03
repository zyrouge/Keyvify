import { Config, checkConfig } from "../Utils/Configuration";
import { isString } from "lodash";
import * as Mongoose from "mongoose";
import { BaseDB, Memory } from "./Base";
import { EventEmitter } from "events";
import * as DataParser from "../Utils/DataParser";
import { Err } from "../Utils/Error";
import Constants from "../Utils/Constants";

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
 * const Database = new KVDB.Mongo("database", config);
 * ```
 */
export class Mongo extends EventEmitter implements BaseDB {
    name: string;
    type: string;
    uri: string;
    mongoose: Mongoose.Mongoose;
    schema: Mongoose.Schema;
    model: Mongoose.Model<MongooseModel>;

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

        this.name = name;
        this.type = config.dialect;
        this.mongoose = config.mongoose || new Mongoose.Mongoose();

        if (!config.uri) throw new Err(...Constants.MISSING_MONGODB_URI);
        this.uri = config.uri;

        this.schema = new Mongoose.Schema({
            key: {
                type: String,
                required: true,
                unique: true
            },
            value: {
                type: String
            }
        });

        this.model = Mongoose.model<MongooseModel>(this.name, this.schema);

        if (config.disableCache !== true) {
            this.cache = new Memory();
        }

        this.connected = false;
        if (this.mongoose.connection.readyState) this.connected = true;

        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }

    async connect() {
        await this.mongoose.connect(this.uri, {
            useNewUrlParser: true
        });
        this.connected = true;
        this.emit("connect");
    }

    async disconnect() {
        await this.mongoose.disconnect();
        this.emit("disconnect");
    }

    async get(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        const cachev = this.cache?.get(key);
        const mod = cachev || (await this.model.findOne({ key }))?.key;
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

        let alr = await this.model.findOne({ key });
        if (!alr) {
            alr = new this.model({ key, val: serval });
        } else {
            oldVal = alr.value ? this.deserializer(alr.value) : undefined;
            alr.update({ value: serval });
        }

        await alr.save();
        this.cache?.set(key, value);

        const val = this.deserializer(value);
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

    async all() {
        const allMods = await this.model.find();
        const allKeys = allMods.map(m => {
            const key = m.key;
            const rvalue = m.value;
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
