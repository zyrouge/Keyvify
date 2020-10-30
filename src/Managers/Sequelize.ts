import { Config } from "../";
import { Sequelize, Model, ModelCtor, DataTypes, Optional } from "sequelize";
import { BaseDB, Memory } from "./Base";
import * as DataParser from "../Utils/DataParser";

export interface SQLModelAttr {
    key: string;
    value: string;
}

interface SQLCreationAttributes extends Optional<SQLModelAttr, "key"> { }

export interface SQLModel
    extends Model<SQLModelAttr, SQLCreationAttributes>,
    SQLModelAttr { }

export class SQL implements BaseDB {
    name: string;
    type: string;
    sequelize: Sequelize;
    model: ModelCtor<SQLModel>;

    cache?: Memory;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    constructor(name: string, config: Config) {
        this.name = name;
        this.type = config.dialect;
        this.sequelize = config.sequelize || new Sequelize({
            database: config.database,
            username: config.username,
            password: config.password,
            host: config.host,
            dialect: config.dialect,
            storage: config.storage
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

        if (config.disableCache !== true) this.cache = new Memory();
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
