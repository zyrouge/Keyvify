import { Keyvify } from "../lib";
import path from "path";

const database = Keyvify("sqlitedatabase", {
    storage: path.join(__dirname, "db", "db.sqlite"),
    dialect: "sqlite"
});

describe("SQLite test", () => {
    test("Checking name", () => {
        expect(database.name).toBe("sqlitedatabase");
    });

    test("Checking type", async () => {
        expect(database.type).toBe("sqlite");
    });

    test("Connect to database", async () => {
        await database.connect();
        expect(database.connected).toBe(true);
    });

    const key = "test12345";
    test("Get a key", async () => {
        const val = await database.get(key);
        expect(val).toBe(undefined);
    });

    const value = "somegoodvalue";
    test("Set a key", async () => {
        const val = await database.set(key, value);
        expect(val).toBe(value);
        console.log(database.cache)
    });

    test("Get the key that was set", async () => {
        console.log(await database.all())
        const val = await database.get(key);
        expect(val).toBe(value);
    });

    test("Count the number of keys in database", async () => {
        const keys = await database.all();
        expect(keys.length).toBe(1);
    });

    test("Count the number of keys in cache", async () => {
        const keys = database.entries();
        expect(keys.length).toBe(1);
    });

    test("Delete the key", async () => {
        const val = await database.delete(key);
        expect(val).toBe(1);
    });

    test("Get the deleted key", async () => {
        const val = await database.get(key);
        expect(val).toBe(undefined);
    });
});