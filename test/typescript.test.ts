import { KeyDB } from "../build";

const config: KeyDB.Utils.Config = {
    dialect: "sqlite"
}

const database = KeyDB("kek", config);

database.on("connect", () => console.log("Connected"));