import { Sequelize, Dialect as SequelizeDialectsType } from "sequelize";
import { Mongoose } from "mongoose";
import * as SQLManager from "./Managers/Sequelize";
export declare const SupportedDialects: string[];
export declare type SupportedDialectsType = SequelizeDialectsType;
export interface Config {
    username?: string;
    password?: string;
    database?: string;
    host?: string;
    uri?: string;
    dialect: SupportedDialectsType;
    storage?: string;
    sequelize?: Sequelize;
    mongoose: Mongoose;
    disableCache?: boolean;
    serializer?: (input: any) => string;
    deserializer?: (input: string) => any;
}
export declare function createDatabase(name: string, config: Config): SQLManager.SQL;
export { createDatabase as default };
