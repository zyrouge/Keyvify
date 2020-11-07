import { Config, checkConfig, isBetterSQLDialect } from "../Utils/Configuration";
import { Err } from "../Utils/Error";
import { isArray, isObject, isString, isUndefined } from "lodash";
import Sqlite from "better-sqlite3";
import { BaseCache, BaseDB, isBaseCacheConstructor, isBaseCacheInstance, Memory, Pair } from "./Base";
import { EventEmitter } from "events";
import path from "path";
import * as DataParser from "../Utils/DataParser";
import Constants from "../Utils/Constants";
import { KeyParams, isKeyNdNotation, DotNotations, isValidLiteral } from "../Utils/DBUtils";
import fs from "fs-extra";

/**
 * The Better-SQL DB Client
 *
 * Refer all the Events here: {@link BaseDB.on}
 *
 * Example:
 * ```js
 * const Database = new Keyvify.BetterSQL("database", config);
 * ```
 */
export class BetterSQL extends EventEmitter implements BaseDB {
    name: string;
    type = "better-sqlite";
    sqlite: Sqlite.Database;

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
        if (!isBetterSQLDialect(config.dialect)) throw new Err(...Constants.INVALID_DIALECT);
        if (!config.storage) throw new Err(...Constants.NO_SQLITE_STORAGE);
        if (!isString(config.storage)) throw new Err(...Constants.INVALID_SQLITE_STORAGE);

        const storagePath = path.isAbsolute(config.storage)
            ? config.storage
            : path.join(process.cwd(), config.storage);
        fs.ensureFileSync(storagePath);
        
        this.name = name;
        this.sqlite = config.dialect instanceof Sqlite ? config.dialect : new Sqlite(storagePath);

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
        if (!this.sqlite.open) throw new Err(...Constants.ERROR_OPENING_CONNECTION);
        const cnt = this.sqlite.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?;").get(this.name);

        if (!cnt["count(*)"]) {
            this.sqlite.prepare(`
                CREATE TABLE ${this.name} (
                    key text NOT NULL PRIMARY KEY,
                    value text
                );
            `).run();

            this.sqlite.pragma("synchronous = 1;");
            this.sqlite.pragma("journal_mode = WAL;");
        }

        this.connected = true;
        this.emit("connect");
    }

    async disconnect() {
        this.sqlite.close();
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
        if (!rval) {
            const raw = this.sqlite.prepare(`SELECT * FROM ${this.name} WHERE key = ?;`).get(key);
            if (raw && raw.value) rval = raw.value;
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

        let mod = this.sqlite.prepare(`SELECT * FROM ${this.name} WHERE key = ?;`).get(key);;
        if (mod && mod.value) {
            oldVal = this.deserializer(`${mod.value}`);
            this.sqlite.prepare(`UPDATE ${this.name} SET value = ? WHERE key = ?;`).run(serval, key);
        } else this.sqlite.prepare(`INSERT INTO ${this.name} (key, value) VALUES (?, ?);`).run(key, serval);
        
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

        const { changes: totalDeleted } = this.sqlite.prepare(`DELETE FROM ${this.name} WHERE key = ?;`).run(key);
        this.cache?.delete(key);
        this.emit("valueDelete", key, totalDeleted);
        return totalDeleted;
    }

    async truncate() {
        const { changes: totalDeleted } = this.sqlite.prepare(`DELETE FROM ${this.name}`).run();
        this.emit("truncate", totalDeleted);
        return totalDeleted;
    }

    async all() {
        const allMods = this.sqlite.prepare(`SELECT * FROM ${this.name}`).all();
        this.cache?.empty();
        const allKeys = allMods.map((m: Pair) => {
            const key = m.key;
            const rvalue = m.value;
            const value = this.deserializer(`${rvalue}`);
            this.cache?.set(key, m.value);
            return { key, value }
        });

        this.emit("valueFetch", allKeys);
        return allKeys;
    }

    entries() {
        return this.cache?.entries() || [];
    }
}