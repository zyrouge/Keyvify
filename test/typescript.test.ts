import { KeyDB } from "../build";

const database = KeyDB("kek", {
    dialect: "sqlite"
});

database.on("connect", () => console.log("Connected"));