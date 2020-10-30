import { Config } from "../";
import { Sequelize, Model, ModelCtor, Optional } from "sequelize";
import { BaseDB, Memory } from "./Base";
export interface SQLModelAttr {
    key: string;
    value: string;
}
interface SQLCreationAttributes extends Optional<SQLModelAttr, "key"> {
}
export interface SQLModel extends Model<SQLModelAttr, SQLCreationAttributes>, SQLModelAttr {
}
export declare class SQL implements BaseDB {
    name: string;
    type: string;
    sequelize: Sequelize;
    model: ModelCtor<SQLModel>;
    cache?: Memory;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;
    constructor(name: string, config: Config);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<any>;
    delete(key: string): Promise<number>;
    all(): Promise<{
        key: string;
        value: any;
    }[]>;
    entries(): {
        key: string;
        value: any;
    }[];
}
export {};
