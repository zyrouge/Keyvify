import { isFunction } from "lodash";
import { Config } from "../Utils/Configuration";

export type Pair = {
    key: string;
    value: any;
}

interface BaseDB {
    type: string;
    name: string;
    cache?: BaseCache;
    connected: boolean;

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;

    get: (key: any) => Promise<any>;
    set: (key: any, value: any) => Promise<any>;
    delete: (key: any) => Promise<number>;
    all: () => Promise<Pair[]>;
    entries: () => Pair[];
    // empty: () => void;

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
}

interface BaseDBConstructor {
    new(name: string, config: Config): BaseDB;
}

declare const BaseDB: BaseDBConstructor;
export { BaseDB };

export function isBaseDB(dialect: any): dialect is BaseDB & BaseDBConstructor {
    if (!dialect) return false;
    if (typeof dialect !== "function") return false;
    if (!dialect.constructor || !isFunction(dialect.constructor)) return false;
    if (!dialect.prototype.connect || !isFunction(dialect.prototype.connect)) return false;
    if (!dialect.prototype.disconnect || !isFunction(dialect.prototype.disconnect)) return false;
    if (!dialect.prototype.get || !isFunction(dialect.prototype.get)) return false;
    if (!dialect.prototype.set || !isFunction(dialect.prototype.set)) return false;
    if (!dialect.prototype.delete || !isFunction(dialect.prototype.delete)) return false;
    if (!dialect.prototype.all || !isFunction(dialect.prototype.all)) return false;
    if (!dialect.prototype.entries || !isFunction(dialect.prototype.entries)) return false;
    if (!dialect.prototype.empty || !isFunction(dialect.prototype.empty)) return false;
    return true;
}

interface BaseCacheConstructor {
    new(): BaseCache;
}

interface BaseCache {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => string | undefined;
    delete: (key: string) => number;
    entries: () => Pair[];
    empty: () => void;
}

declare const BaseCache: BaseCacheConstructor;
export { BaseCache };

export function isBaseCache(cache: any): cache is BaseCache & BaseCacheConstructor {
    if (!cache) return false;
    if (typeof cache !== "function") return false;
    if (!cache.constructor || !isFunction(cache.constructor)) return false;
    if (!cache.prototype.get || !isFunction(cache.prototype.get)) return false;
    if (!cache.prototype.set || !isFunction(cache.prototype.set)) return false;
    if (!cache.prototype.delete || !isFunction(cache.prototype.delete)) return false;
    if (!cache.prototype.entries || !isFunction(cache.prototype.entries)) return false;
    if (!cache.prototype.empty || !isFunction(cache.prototype.empty)) return false;
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
        return Object.entries(this.base).map(([key, value]) => ({ key, value }));
    }

    empty() {
        return this.base.clear();
    }
}