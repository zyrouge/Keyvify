const { Keyvify } = require("keyvify");

const database = Keyvify("my_super_awesome_database", {
    dialect: "sqlite", // or some others like postgres
    storage: __dirname + "/../database.sqlite", // for sqlite
    // username: "hackerman", // if needed
    // password: "pass", // if needed
    // cache: false, // to disable caching not recommended
    // host: "localhost", // if needed
    // port: 0000 // if needed
});

const init = async () => {
    // connect
    await database.connect();

    const key = "hello";
    const value = "world";
    const newvalue = "everyone";
    const key2 = "array";
    const value2 = ["val1", "val2"];
    const key3 = "math";

    // set a data
    await database.set(key, value); // returns: { key: "hello", value: "world" }

    // get a data
    await database.get(key); // returns: { key: "hello", value: "world" }

    // set a data (updating)
    await database.set(key, newvalue); // returns: { key: "hello", value: "world" }

    // push a data
    await database.push(key2, value2[0]); // returns: { key: "array", value: ["val1"] }

    // push a data (2)
    await database.push(key2, value2[1]); // returns: { key: "array", value: ["val1", "val2"] }

    // pull a data
    await database.pull(key2, value2[0]); // returns: { key: "array", value: ["val2"] }

    // add a data
    await database.add(key3, 10); // returns: { key: "math", value: 10 }

    // subtract a data
    await database.subtract(key3, 5); // returns: { key: "math", value: 5 }

    // multiply a data
    await database.multiply(key3, 2); // returns: { key: "math", value: 10 }

    // divide a data
    await database.divide(key3, 2); // returns: { key: "math", value: 5 }

    // raise a data by power
    await database.exponent(key3, 2); // returns: { key: "math", value: 25 }

    // modulo a data
    await database.modulo(key3, 5); // returns: { key: "math", value: 0 }

    // do math on a data
    await database.math(key3, "+", 10); // returns: { key: "math", value: 10 }

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