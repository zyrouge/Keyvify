const { Keyvify } = require("../lib");

const database = Keyvify("database", {
    storage: "./test/db/db.sqlite",
    dialect: "sqlite"
});

describe("SQLite test", () => {
    test("Checking type", () => {
        expect(database.type).toBe("sqlite");
    });
});