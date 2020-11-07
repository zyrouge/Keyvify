import { Keyvify } from "../../src";

const database = Keyvify("my_super_awesome_database", {
    dialect: "better-sqlite",
    storage: __dirname + "/../database.sqlite"
});

const init = async () => {
    // connect
    await database.connect();

    const key = "hello";
    const value = "world";
    const newvalue = "everyone";

    // set a data
    await database.set(key, value); // returns: { key: "hello", value: "world" }

    // get a data
    await database.get(key); // returns: { key: "hello", value: "world" }

    // set a data (updating)
    await database.set(key, newvalue); // returns: { key: "hello", value: "world" }

    // get all data (fetches from the database)
    await database.all(); // returns: [{ key: "hello", value: "world" }]

    // get all **cached** data (only data from `database.cache` and doesnt need await)
    database.entries(); // returns: [{ key: "hello", value: "world" }]

    // delete a data
    await database.delete(key); // returns: 1

    // delete all
    await database.truncate(); // returns: 0 (number of deleted keys)

    // disconnect
    await database.disconnect();
}

database.on("connect", () => console.log("Connected!"));
database.on("disconnect", () => console.log("Disconnected!"));
database.on("valueSet", (pair) => console.log("Some data was set:", pair));
database.on("valueGet", (pair) => console.log("Some data was got:", pair));
database.on("valueDelete", (key) => console.log("Some key was deleted:", key));
database.on("valueUpdate", (pair) => console.log("Some data was changed:", pair));
database.on("valueFetch", (pairs) => console.log("All data were fetched:", pairs));
database.on("truncate", (amount) => console.log("Database was emptied:", amount));

init();