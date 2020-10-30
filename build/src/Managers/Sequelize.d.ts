import { Config } from "../";
import { Sequelize, Model, ModelCtor, Optional } from "sequelize";
import { BaseDB, ValueModel } from "./Base";
export interface SQLModelAttr {
    key: string;
    value: string;
}
interface SQLCreationAttributes extends Optional<SQLModelAttr, "key"> {
}
interface SQLModel extends Model<SQLModelAttr, SQLCreationAttributes>, SQLModelAttr {
}
export declare class SQL implements BaseDB {
    name: string;
    type: string;
    sequelize: Sequelize;
    model: ModelCtor<SQLModel>;
    serializer: (input: any) => string;
    deserializer: (input: string) => any;
    constructor(name: string, config: Config);
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<any>;
    all(): Promise<ValueModel[]>;
}
export {};
