import { Config, checkConfig, isBetterSQLDialect } from "../Utils/Configuration";
import { Err } from "../Utils/Error";
import { isString, isUndefined } from "lodash";
import Sqlite from "better-sqlite3";
import { BaseCache, BaseDB, isBaseCacheConstructor, isBaseCacheInstance, Memory, Pair } from "./Base";
import { EventEmitter } from "events";
import path from "path";
import * as DataParser from "../Utils/DataParser";
import Constants from "../Utils/Constants";

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
        if (!isString(name)) throw new Err(...Constants.INVALID_DB_NAME);
        if (!config) throw new Err(...Constants.NO_CONFIG);
        checkConfig(config, false);
        if (!isBetterSQLDialect(config.dialect)) throw new Err(...Constants.INVALID_DIALECT);
        if (!config.storage) throw new Err(...Constants.NO_SQLITE_STORAGE);
        if (!isString(config.storage)) throw new Err(...Constants.INVALID_SQLITE_STORAGE);

        const storagePath = path.isAbsolute(config.storage)
            ? config.storage
            : path.join(process.cwd(), config.storage);

        this.name = name;
        this.sqlite = config.dialect instanceof Sqlite ? config.dialect : new Sqlite(storagePath);

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
        if (!this.sqlite.open) throw new Err(...Constants.ERROR_OPENING_CONNECTION);
        const cnt = this.sqlite.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?;").get(this.name);

        if (!cnt["count(*)"]) {
            this.sqlite.prepare(`
                CREATE TABLE ${this.name} (
                    key text NOT NULL PRIMARY KEY,
                    value text NOT NULL
                );
            `).run();

            this.sqlite.pragma("synchronous = 1;");
            this.sqlite.pragma("journal_mode = WAL;");
        }
    }

    async disconnect() {
        this.sqlite.close();
        this.emit("disconnect");
    }

    async get(key: string) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);

        let rval = this.cache?.get(key);
        if (!rval) {
            const raw = this.sqlite.prepare(`SELECT * FROM ${this.name} WHERE key = ?;`).get(key);
            if (raw && raw.value) rval = raw.value;
        }

        const val = rval ? this.deserializer(rval) : undefined;
        this.emit("valueGet", { key, value: val });
        return val;
    }

    async set(key: string, value: any) {
        if (!key) throw new Err(...Constants.NO_KEY);
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);
        if (!value) throw new Err(...Constants.NO_VALUE);

        const serval = this.serializer(value);
        let oldVal: any;

        const isThere = this.get(key);
        if (!isThere) {
            oldVal = this.deserializer(isThere);
            this.sqlite.prepare(`UPDATE ${this.name} SET value = ? WHERE key = ?;`).run(serval, key);
        } else {
            this.sqlite.prepare(`INSERT INTO ${this.name} (key, value) VALUES (?, ?);`).run(key, serval);
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

        const { changes: totalDeleted } = this.sqlite.prepare(`DELETE FROM ${this.name} WHERE key = ?;`).run(key);
        this.cache?.delete(key);
        this.emit("valueDelete", key, totalDeleted);
        return totalDeleted;
    }

    async all() {
        const allMods = this.sqlite.prepare(`SELECT * FROM ${this.name}`).all();
        const allKeys: Pair[] = allMods.map(m => {
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
        return this.cache?.entries() || [];
    }
}