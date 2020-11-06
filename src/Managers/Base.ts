import { EventEmitter } from "events";
import { isFunction } from "lodash";
import { Config } from "../Utils/Configuration";
import { KeyParams } from "../Utils/DBUtils";

export type Pair = {
    key: string;
    value: any;
}

export interface BaseDB extends EventEmitter {
    type: string;
    name: string;
    cache?: BaseCache;
    connected: boolean;

    connect(): Promise<void>;
    disconnect(): Promise<void>;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;

    get(key: KeyParams): Promise<any>;
    set(key: KeyParams, value: any): Promise<any>;
    delete(key: string): Promise<number>;
    truncate(): Promise<number>;
    all(): Promise<Pair[]>;
    entries(): Pair[];

    /**
     * Emitted on connect
     */
    on(event: "connect", listener: () => void): this;

    /**
     * Emitted on disconnect
     */
    on(event: "disconnect", listener: () => void): this;

    /**
     * Emitted when a value is set
     */
    on(event: "valueSet", listener: (pair: Pair) => void): this;

    /**
     * Emitted when a value is retrieved
     */
    on(event: "valueGet", listener: (pair: Pair) => void): this;

    /**
     * Emitted when a value is updated
     */
    on(event: "valueUpdate", listener: (oldPair: Pair, newPair: Pair) => void): this;

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

export interface BaseCache {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => string | undefined;
    delete: (key: string) => number;
    entries: () => Pair[];
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
        return [...this.base.entries()].map(([key, value]) => ({ key, value }));
    }

    empty() {
        return this.base.clear();
    }
}