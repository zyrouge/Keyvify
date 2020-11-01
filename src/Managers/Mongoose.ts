import { Config } from "../Utils/Configuration";
import * as Mongoose from "mongoose";
import { BaseDB, Memory } from "./Base";
import { EventEmitter } from "events";
import * as DataParser from "../Utils/DataParser";
import { Err } from "../Utils/Error";

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
 * const Database = new KeyDB.Mongo("database", config);
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
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    constructor(name: string, config: Config) {
        super();

        this.name = name;
        this.type = config.dialect;
        this.mongoose = config.mongoose || new Mongoose.Mongoose();

        if (!config.uri) throw new Err("No Mongoose URI was passed", "MISSING_MONGODB_URI");
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
        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }

    async connect() {
        await this.mongoose.connect(this.uri, {
            useNewUrlParser: true
        });
        this.emit("connect");
    }

    async disconnect() {
        await this.mongoose.disconnect();
        this.emit("disconnect");
    }

    async get(key: string) {
        const cachev = this.cache?.get(key);
        const mod = cachev || (await this.model.findOne({ key }))?.key || undefined;
        const val = mod ? this.deserializer(mod) : undefined;
        this.emit("valueGet", { key, value: val });
        return val;
    }

    async set(key: string, value: any) {
        const obj = { key, value: this.serializer(value) };
        let isUpdated = false;

        let alr = await this.model.findOne({ key });
        if (!alr) {
            alr = new this.model(obj);
        } else {
            isUpdated = true;
            alr.update({ value: obj.value });
        }

        await alr.save();
        this.cache?.set(obj.key, obj.value);

        const val = this.deserializer(obj.value);
        isUpdated
            ? this.emit("valueUpdate", { key, value: val })
            : this.emit("valueSet", { key, value: val });
        return val;
    }

    async delete(key: string) {
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
