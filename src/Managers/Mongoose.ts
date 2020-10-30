import { Config } from "../";
import Mongoose from "mongoose";
import { BaseDB, Memory } from "./Base";
import * as DataParser from "../Utils/DataParser";
import { Err } from "../Utils/Error";

export interface MongooseModel extends Mongoose.Document {
    key: string;
    value: string;
}

export class Mongo implements BaseDB {
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

        if (config.disableCache !== true) this.cache = new Memory();
        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }

    async connect() {
        await this.mongoose.connect(this.uri, {
            useNewUrlParser: true
        });
    }

    async disconnect() {
        await this.mongoose.disconnect();
    }

    async get(key: string) {
        const cachev = this.cache?.get(key);
        const mod = cachev || (await this.model.findOne({ key })).key || undefined;

        return mod ? this.deserializer(mod) : undefined;
    }

    async set(key: string, value: any) {
        const obj = { key, value: this.serializer(value) };
        let alr = await this.model.findOne({ key });

        if (!alr) {
            alr = new this.model(obj);
        } else {
            alr.update({ value: obj.value });
        }

        await alr.save();
        this.cache?.set(obj.key, obj.value);

        return this.deserializer(obj.value);
    }

    async delete(key: string) {
        const totalDeleted = await this.model.deleteOne({ key });
        this.cache?.delete(key);

        return totalDeleted.deletedCount || 0;
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

        return allKeys;
    }

    entries() {
        return this.cache?.all() || [];
    }
}
