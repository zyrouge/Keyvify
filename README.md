<p align="center">
  <img
    src="https://keyvify.js.org/assets/logo.png" width="230px">
</p>

<h1 align="center">Keyvify</h1>
<p align="center">A simple key-value database supporting various dialects</p>

[![npm version](https://badgen.net/npm/v/keyvify)](https://www.npmjs.com/package/keyvify)
[![npm downloads](https://badgen.net/npm/dm/keyvify)](https://www.npmjs.com/package/keyvify)

## 📦 Installation

```console
$ npm install keyvify
```

and also a Dialect

```console
$ npm i pg pg-hstore # Postgres
$ npm i mysql2 # MySQL
$ npm i mariadb # MariaDB
$ npm i sqlite3 # SQLite
$ npm i better-sqlite3 # Better SQLite
$ npm i mongoose # MongoDB
$ npm i tedious # Microsoft SQL Server
```

## ❔ But why Keyvify?

- Simple as [this](#%EF%B8%8F-basic-example)
- Easy for beginners
- Persistent
- Promise-based
- Supports [multiple databases](https://keyvify.js.org/docs/globals.html#supporteddialectsstrs)
- Support for **dot notation**
- Import and Export the data to a simple JSON file
- Store almost anything (Refer all the types [here](https://www.npmjs.com/package/serialize-javascript))
- Quick setup (When using **better-sqlite3** or **sqlite**)
- In-built caching using NodeJS `Map`
- Support for custom **Dialects** and **Cache** store
- Typescript support
- Works from NodeJS v8 (might vary)

## 🤔 How does it work?

- Keyvify internally uses [Better SQLite](https://www.npmjs.com/package/better-sqlite3) for SQLite, [Sequelize](https://www.npmjs.com/package/sequelize) for other SQL related-databases, [Mongoose](https://www.npmjs.com/package/mongoose) for MongoDB
- Serializes all the data into `string` to store in database. Uses [sequelize-javascript](https://www.npmjs.com/package/serialize-javascript) by default due to limitation in `JSON.stringify`
- Keyvify caches the data when something is `set`, `get`, `delete` and `fetch`

## 📄 Documentation

Refer [here](https://keyvify.js.org/docs)

## 📙 Guides

Refer [here](https://keyvify.js.org/guide)

## ✏️ Basic Example

```js
const { Keyvify } = require("keyvify");

const database = Keyvify("my_super_awesome_database", {
  dialect: "better-sqlite",
  storage: __dirname + "/../database.sqlite",
});

const init = async () => {
  // connect
  await database.connect();

  // set a data
  await database.set("hello", "world"); // returns: { key: "hello", value: "world" }

  // get a data
  await database.get("hello"); // returns: { key: "hello", value: "world" }

  // get all data (fetches from the database)
  await database.all(); // returns: [{ key: "hello", value: "world" }]

  // get all **cached** data (only data from `database.cache` and doesnt need await)
  database.entries(); // returns: [{ key: "hello", value: "world" }]

  // delete a data
  await database.delete("hello"); // returns: 1

  // delete all
  await database.truncate(); // returns: 0 (number of deleted keys)

  // disconnect
  await database.disconnect();
};

database.on("connect", () => console.log("Connected!"));
database.on("disconnect", () => console.log("Disconnected!"));
database.on("valueSet", (pair) => console.log("Some data was set:", pair));
database.on("valueGet", (pair) => console.log("Some data was got:", pair));
database.on("valueDelete", (key) => console.log("Some key was deleted:", key));
database.on("valueUpdate", (pair) =>
  console.log("Some data was changed:", pair)
);
database.on("valueFetch", (pairs) =>
  console.log("All data were fetched:", pairs)
);
database.on("truncate", (amount) =>
  console.log("Database was emptied:", amount)
);
```

Click [here](./examples) for more examples

## 🚩 Resources

- [Website](https://keyvify.js.org)
- [Documentation](https://keyvify.js.org/docs)
- [NPM](https://npmjs.com/keyvify)
- [Discord](https://zyrouge.gq/discord)
