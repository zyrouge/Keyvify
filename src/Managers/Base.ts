export type Pair = {
    key: string;
    value: any;
}

export interface BaseDB {
    type: string;
    name: string;
    cache?: Memory;

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;

    get: (key: any) => Promise<any>;
    set: (key: any, value: any) => Promise<any>;
    delete: (key: any) => Promise<number>;
    all: () => Promise<Pair[]>;
    entries: () => Pair[];
}

export class Memory extends Map<string, string> {
    type = "Memory";

    constructor() {
        super();
    }

    all() {
        return Object.entries(this).map(([key, value]) => ({ key, value }));
    }
}