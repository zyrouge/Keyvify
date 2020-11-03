export type Pair = {
    key: string;
    value: any;
}

export interface BaseDB {
    type: string;
    name: string;
    cache?: Memory;
    connected: boolean;

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;

    get: (key: any) => Promise<any>;
    set: (key: any, value: any) => Promise<any>;
    delete: (key: any) => Promise<number>;
    all: () => Promise<Pair[]>;
    entries: () => Pair[];

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

export interface BaseCache {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => string | undefined;
    delete: (key: string) => number;
    entries: () => Pair[];
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
}