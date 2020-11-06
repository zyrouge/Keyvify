import { Keyvify } from "../../src";

const database = Keyvify("my_super_awesome_database", {
    dialect: "mongodb",
    uri: process.env.MONGODB_URL
});

const init = async () => {
    // connect
    await database.connect();

    const key = "hello";
    const value = "world";

    // set a data
    await database.set(key, value); // returns: "world"

    // get a data
    await database.get(key); // returns: "world"

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

database.on("valueGet", (pair) => console.log("Some data was fetched", pair));

database.on("valueSet", (pair) => console.log("Some data was set", pair));

database.on("valueDelete", (key) => console.log("Some key was deleted", key));

database.on("valueUpdate", (oldpair, newpair) => console.log("Some data was changed", oldpair, newpair));

database.on("valueFetch", (pairs) => console.log("All data were fetched", pairs));

database.on("truncate", (amount) => console.log("Database was emptied", amount));

init();