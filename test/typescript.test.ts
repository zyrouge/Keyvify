import { KVDB } from "../lib";

const config: KVDB.Utils.Config = {
    dialect: "sqlite"
}

const database = KVDB("kek", config);

database.on("connect", () => console.log("Connected"));