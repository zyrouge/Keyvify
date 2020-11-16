import { Keyvify } from "../src";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";

const memMongoServer = new MongoMemoryServer();
const tests: {
    config: Keyvify.Configuration.Config,
    toString(): string,
    cleanUp?(): Promise<void>
}[] = [
    {
        config: {
            storage: path.join(__dirname, "db", "sqldb.sqlite"),
            dialect: "sqlite"
        },
        toString() { return "SQLite" }
    }, {
        config: {
            storage: path.join(__dirname, "db", "bsqldb.sqlite"),
            dialect: "better-sqlite"
        },
        toString() { return "Better SQLite" }
    }, {
        config: {
            dialect: "mongodb",
            uri: "nouri"
        },
        toString() { return "MongoDB" },
        async cleanUp() { await memMongoServer.stop() }
    }
];

describe.each(tests)("%s", ({ config, cleanUp }) => {
    const name = `testing_database`;
    const database = Keyvify(name, config);

    const evnts = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        valueSet: jest.fn(),
        valueGet: jest.fn(),
        valueUpdate: jest.fn(),
        valueDelete: jest.fn(),
        valueFetch: jest.fn(),
        truncate: jest.fn()
    }

    Object.entries(evnts).forEach(ev => database.on(...ev));

    test("Checking name", () => {
        expect(database.name).toBe(name);
    });

    test("Checking type", () => {
        expect(database.type).toBe(config.dialect);
    });

    test("Connect to database", async () => {
        if (database.type === "mongodb" && "uri" in database) {
            const uri = await memMongoServer.getUri();
            // @ts-ignore
            database.uri = uri;
        } // testing purpose only

        await database.connect();
        expect(database.connected).toBe(true);
        expect(evnts.connect).toBeCalled();
    });

    const key1 = "test12345";
    test("Get a key", async () => {
        const val = await database.get(key1);
        expect(val.value).toBe(undefined);
        expect(evnts.valueGet).toBeCalled();
    });

    const value1 = "somegoodvalue";
    test("Set a key", async () => {
        const val = await database.set(key1, value1);
        expect(val.value).toBe(value1);
        expect(evnts.valueSet).toBeCalled();
    });

    test("Get the key that was set", async () => {
        const val = await database.get(key1);
        expect(val.value).toBe(value1);
        expect(evnts.valueGet).toBeCalled();
    });

    const nvalue1 = "somegoodvalue";
    test("Update a key", async () => {
        const val = await database.set(key1, nvalue1);
        expect(val.value).toBe(nvalue1);
        expect(evnts.valueUpdate).toBeCalled();
    });

    test("Get the key that was updated", async () => {
        const val = await database.get(key1);
        expect(val.value).toBe(nvalue1);
        expect(evnts.valueGet).toBeCalled();
    });

    const key2 = "objtest12345";
    test("Get a key (2)", async () => {
        const val = await database.get(key2);
        expect(val.value).toBe(undefined);
        expect(evnts.valueGet).toBeCalled();
    });

    const value2 = { hello: "world" };
    test("Set a key (2)", async () => {
        const val = await database.set(key2, value2);
        expect(val.value).toStrictEqual(value2);
        expect(evnts.valueSet).toBeCalled();
    });

    test("Get the key that was set (2)", async () => {
        const val = await database.get(key2);
        expect(val.value).toStrictEqual(value2);
        expect(evnts.valueGet).toBeCalled();
    });

    test("Get the key that was set (2) but only hello", async () => {
        const val = await database.get([key2, "hello"]);
        expect(val.value).toBe(value2.hello);
        expect(evnts.valueGet).toBeCalled();
    });

    test("Count the number of keys in database", async () => {
        const keys = await database.all();
        expect(keys.length).toBe(2);
        expect(evnts.valueFetch).toBeCalled();
    });

    test("Count the number of keys in cache", async () => {
        const keys = database.entries();
        expect(keys.length).toBe(2);
    });

    test("Delete the key", async () => {
        const val = await database.delete(key1);
        expect(val).toBe(1);
        expect(evnts.valueDelete).toBeCalled();
    });

    test("Get the deleted key", async () => {
        const val = await database.get(key1);
        expect(val.value).toBe(undefined);
        expect(evnts.valueGet).toBeCalled();
    });

    test("Empty the table", async () => {
        const val = await database.truncate();
        expect(val).toBe(1);
        expect(evnts.truncate).toBeCalled();
    });

    test("Close the connection", async () => {
        const val = await database.disconnect();
        expect(val).toBe(undefined);
        expect(database.connected).toBe(false);
        expect(evnts.disconnect).toBeCalled();
        if (cleanUp) cleanUp();
    });
}, 10 * 1000);