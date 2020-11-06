import { Keyvify } from "../src";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";

const memMongoServer = new MongoMemoryServer();
const dialects: Keyvify.Configuration.Config[] & { toString(): string } = [
    {
        storage: path.join(__dirname, "db", "sqldb.sqlite"),
        dialect: "sqlite",
        toString() { return "SQLite" }
    }, {
        storage: path.join(__dirname, "db", "bsqldb.sqlite"),
        dialect: "better-sqlite",
        toString() { return "Better SQLite" }
    }, {
        dialect: "mongodb",
        uri: "nouri",
        toString() { return "MongoDB" }
    }
];

describe.each(dialects)("%s", (config) => {

    const name = `testing_database`;
    const database = Keyvify(name, config);
    
    test("Checking name", () => {
        expect(database.name).toBe(name);
    });

    test("Checking type", () => {
        expect(database.type).toBe(config.dialect);
    });

    test("Connect to database", async () => {
        if (database.type === "mongodb" && "uri" in database) {
            const uri = await memMongoServer.getUri();
            database.uri = uri;
        } // testing purpose

        await database.connect();
        expect(database.connected).toBe(true);
    });

    const key1 = "test12345";
    test("Get a key", async () => {
        const val = await database.get(key1);
        expect(val).toBe(undefined);
    });

    const value1 = "somegoodvalue";
    test("Set a key", async () => {
        const val = await database.set(key1, value1);
        expect(val).toBe(value1);
    });

    test("Get the key that was set", async () => {
        const val = await database.get(key1);
        expect(val).toBe(value1);
    });

    const key2 = "objtest12345";
    test("Get a key (2)", async () => {
        const val = await database.get(key2);
        expect(val).toBe(undefined);
    });

    const value2 = { hello: "world" };
    test("Set a key (2)", async () => {
        const val = await database.set(key2, value2);
        expect(val).toStrictEqual(value2);
    });

    test("Get the key that was set (2)", async () => {
        const val = await database.get(key2);
        expect(val).toStrictEqual(value2);
    });

    test("Get the key that was set (2) but only hello", async () => {
        const val = await database.get([key2, "hello"]);
        expect(val).toBe(value2.hello);
    });

    test("Count the number of keys in database", async () => {
        const keys = await database.all();
        expect(keys.length).toBe(2);
    });

    test("Count the number of keys in cache", async () => {
        const keys = database.entries();
        expect(keys.length).toBe(2);
    });

    test("Delete the key", async () => {
        const val = await database.delete(key1);
        expect(val).toBe(1);
    });

    test("Get the deleted key", async () => {
        const val = await database.get(key1);
        expect(val).toBe(undefined);
    });

    test("Empty the table", async () => {
        const val = await database.truncate();
        expect(val).toBe(1);
    });

    test("Close the connection", async () => {
        const val = await database.disconnect();
        expect(val).toBe(undefined);
        expect(database.connected).toBe(false);
        if (database.type === "mongodb") await memMongoServer.stop();
    });
});