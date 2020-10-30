export interface BaseDB {
    type: string;
    name: string;
    get: (key: any) => Promise<any>;
    set: (key: any, value: any) => Promise<any>;
    all: () => Promise<any>;
}
export interface ValueModel {
    key: string;
    value: any;
}
