import { Keyvify } from "../lib";

const config: Keyvify.Utils.Config = {
    dialect: "sqlite"
}

const database = Keyvify("kek", config);

database.on("connect", () => console.log("Connected"));