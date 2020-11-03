# Basic Usage

## Javascript

```js
const { KVDB } = require("kv.db");

const config = {
    dialect: "postgres", // Can be any dialect
    username: "someuser",
    password: "youshallnotpass",
    host: "localhost",
    port: "8080"
}

const Database = KVDB("database_name", config);

const doSomething = async () => {
    Database.set("user_12345", { username: "SpookyMan" }); // Returns: Spookyman

    Database.get("user_54321"); // Returns: { username: SomeUser }

    Database.delete("user_12345"); // Returns: 1 (no. of deleted keys)

    Database.all(); // Returns: [{ username: "SpookyMan" }, ...and_all_other_keys]
}

doSomething();
```

## Typescript

```ts
import { KVDB } from "kv.db";

const config: KVDB.Utils.Config = {
    dialect: "postgres", // Can be any dialect
    username: "someuser",
    password: "youshallnotpass",
    host: "localhost",
    port: "8080"
}

const Database = KVDB("database_name", config);

const doSomething = async () => {
    Database.set("user_12345", { username: "SpookyMan" }); // Returns: Spookyman

    Database.get("user_54321"); // Returns: { username: SomeUser }

    Database.delete("user_12345"); // Returns: 1 (no. of deleted keys)

    Database.all(); // Returns: [{ username: "SpookyMan" }, ...and_all_other_keys]
}

doSomething();
```