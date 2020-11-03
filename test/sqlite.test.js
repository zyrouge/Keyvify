const { Keyvify } = require("../lib");

const database = Keyvify("database", {
    storage: "./test/db/db.sqlite",
    dialect: "sqlite"
});

database.on("connect", () => {

});

describe("Checking Database", () => {
    expect(database.type).toBe("sqlite");
});