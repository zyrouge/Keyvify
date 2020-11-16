import { EventEmitter } from "events";
import { isFunction, isString } from "lodash";
import { Config } from "../Utils/Configuration";
import Constants from "../Utils/Constants";
import { KeyParams } from "../Utils/Utilites";
import { Err } from "../Utils/Error";

export interface Pair {
    key: string;
    value: any;
    full: any;
    old?: any;
}

export class Pair {
    constructor(key: string, value: any) {
        if (!isString(key)) throw new Err(...Constants.INVALID_KEY);
        this.key = key;
        this.value = value;
        this.full = value;
    }
}

/**
 * Default structure of the BaseDB. All the database are in this structure and must be.
 */
export interface BaseDB extends EventEmitter {
    /**
     * Type of the database
     */
    readonly type: string;

    /**
     * Name of the database
     */
    readonly name: string;

    /**
     * Shows if the database is connected
     */
    connected: boolean;

    /**
     * Serializer used to serialize the data
     */
    readonly serializer: (input: any) => string;

    /**
     * Deserializer used to deserialize the data
     */
    readonly deserializer: (input: string) => any;

    /**
     * Connects to the database and perform inital tasks
     * @example ```js
     * await database.connect();
     * ```
     */
    connect(): Promise<void>;

    /**
     * Disconnects from the database
     * @example ```js
     * await database.disconnect();
     * ```
     */
    disconnect(): Promise<void>;

    /**
     * Sets a value for the specified key
     * @param key Key for which the data should be got
     * @example ```js
     * await database.set("somekey", { hello: { world: true } });
     * await database.get(["somekey", "hello.world"]); // with Dot notations
     * await database.get("somekey.hello.world"); // with Dot notations
     * ```
     */
    get(key: KeyParams): Promise<Pair>;

    /**
     * Sets a value for the specified key
     * @param key Key for which the data should be set
     * @param value Value to be set
     * @example ```js
     * await database.set("somekey", { hello: { world: true } });
     * await database.set(["somekey", "hello.world"], false); // with Dot notations
     * await database.set("somekey.hello.world", false); // with Dot notations
     * ```
     */
    set(key: KeyParams, value: any): Promise<Pair>;

    /**
     * Sets a value for the specified key
     * @param key Key for which the data should be set
     * @param value Value to be set
     * @example ```js
     * await database.pull("somekey", "hello");
     * await database.pull(["somekey", "hello.world"], "hello"); // with Dot notations
     * await database.pull("somekey.hello.world", "hello"); // with Dot notations
     * ```
     */
    pull(key: KeyParams, value: any): Promise<Pair>;

    /**
     * Sets a value for the specified key
     * @param key Key for which the data should be set
     * @param value Value to be set
     * @example ```js
     * await database.push("somekey", "hello");
     * await database.push(["somekey", "hello.world"], "hello"); // with Dot notations
     * await database.push("somekey.hello.world", "hello"); // with Dot notations
     * ```
     */
    push(key: KeyParams, value: any): Promise<Pair>;

    /**
     * Deletes a data pair from the table
     * @param key Key to be deleted
     * @example ```js
     * await database.delete();
     * ```
     */
    delete(key: string): Promise<number>;

    /**
     * Truncates all the data from the table
     * @example ```js
     * await database.truncate();
     * ```
     */
    truncate(): Promise<number>;

    /**
     * Fetches everything from database
     * @example ```js
     * await database.all();
     * ```
     */
    all(): Promise<Pair[]>;

    /**
     * Gives all cached data (empty if cache is disabled)
     * @example ```js
     * database.entries();
     * ```
     */
    entries(): Pair[];

    /**
     * Clears cache
     * @example ```js
     * database.empty();
     * ```
     */
    empty(): void;

    on(event: string, listener: (...args: any[]) => void): this;
    
    /**
     * Emitted on connect or disconnected
     */
    on(event: "connect" | "disconnect", listener: () => void): this;

    /**
     * Emitted when a value is set, retrieved or updated
     */
    on(event: "valueSet" | "valueGet" | "valueUpdate", listener: (pair: Pair) => void): this;

    /**
     * Emitted when a value is updated
     */
    on(event: "valueDelete", listener: (key: string, deletedCount: number) => void): this;

    /**
     * Emitted when values are fetched
     */
    on(event: "valueFetch", listener: (pairs: Pair[]) => void): this;

    /**
     * Emitted when all values are deleted
     */
    on(event: "truncate", listener: (deletedCount: number) => void): this;
}

export interface BaseDBConstructor {
    new (name: string, config: Config): BaseDB;
}

export function isBaseDBConstructor(dialect: any): dialect is BaseDBConstructor {
    if (!dialect) return false;
    if (typeof dialect !== "function") return false;
    if (!dialect.constructor || !isFunction(dialect.constructor)) return false;
    if (!isBaseDBInstance(dialect.prototype)) return false;
    return true;
}

export function isBaseDBInstance(dialectProtos: any): dialectProtos is BaseDB {
    if (!dialectProtos) return false;
    if (typeof dialectProtos !== "object" && !Array.isArray(dialectProtos)) return false;
    if (!dialectProtos.connect || !isFunction(dialectProtos.prototype.connect)) return false;
    if (!dialectProtos.disconnect || !isFunction(dialectProtos.disconnect)) return false;
    if (!dialectProtos.get || !isFunction(dialectProtos.get)) return false;
    if (!dialectProtos.set || !isFunction(dialectProtos.set)) return false;
    if (!dialectProtos.delete || !isFunction(dialectProtos.delete)) return false;
    if (!dialectProtos.all || !isFunction(dialectProtos.all)) return false;
    if (!dialectProtos.entries || !isFunction(dialectProtos.entries)) return false;
    return true;
}

export interface BaseCacheConstructor {
    new(): BaseCache;
}

/**
 * Default structure of the Cache. All the cache store are in this structure and must be.
 */
export interface BaseCache {
    /**
     * Get a cached key (returns undeserialized data)
     */
    get: (key: string) => string | undefined;
    
    /**
     * Set a cached/new key (pass in the serialized data)
     */
    set: (key: string, value: string) => string | undefined;

    /**
     * Delete a cached key
     */
    delete: (key: string) => number;

    /**
     * All the cached pairs
     */
    entries: () => Pair[];

    /**
     * Empties the cache store
     */
    empty: () => void;
}

export function isBaseCacheConstructor(cache: any): cache is BaseCacheConstructor {
    if (!cache) return false;
    if (typeof cache !== "function") return false;
    if (!cache.constructor || !isFunction(cache.constructor)) return false;
    if (!isBaseCacheInstance(cache.prototype)) return false;
    return true;
}

export function isBaseCacheInstance(cacheProtos: any): cacheProtos is BaseCache {
    if (!cacheProtos) return false;
    if (typeof cacheProtos !== "object" && !Array.isArray(cacheProtos)) return false;
    if (!cacheProtos.get || !isFunction(cacheProtos.get)) return false;
    if (!cacheProtos.set || !isFunction(cacheProtos.set)) return false;
    if (!cacheProtos.delete || !isFunction(cacheProtos.delete)) return false;
    if (!cacheProtos.entries || !isFunction(cacheProtos.entries)) return false;
    if (!cacheProtos.empty || !isFunction(cacheProtos.empty)) return false;
    return true;
}

/**
 * Default Memory store
 */
export class Memory implements BaseCache {
    type = "Memory";
    base: Map<string, string>;

    constructor() {
        this.base = new Map();
    }

    get(key: string) {
        return this.base.get(key);
    }

    set(key: string, value: string) {
        this.base.set(key, value);
        return value;
    }

    delete(key: string) {
        return Number(this.base.delete(key));
    }

    entries() {
        return [...this.base.entries()].map(([key, value]) => new Pair(key, value));
    }

    empty() {
        return this.base.clear();
    }
}