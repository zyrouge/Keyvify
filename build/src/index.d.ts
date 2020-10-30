import { Sequelize, Dialect } from "sequelize";
import * as SQLManager from "./Managers/Sequelize";
interface Config {
    username?: string;
    password?: string;
    database?: string;
    dialect: Dialect;
    storage?: string;
    sequelize?: Sequelize;
    serializer?: (input: any) => string;
    deserializer?: (input: string) => any;
}
declare function createDatabase(name: string, config: Config): SQLManager.SQL;
export { createDatabase as default, createDatabase, Config };
