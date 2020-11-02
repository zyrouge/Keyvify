# Basic Usage

## Javascript

```js
const { KeyDB } = require("key.db");

const config = {
    dialect: "postgres", // Can be any dialect
    username: "someuser",
    password: "youshallnotpass",
    host: "localhost",
    port: "8080"
}

const Database = KeyDB("database_name", config);

const doSomething = async () => {
    KeyDB.set("user_12345", { username: "SpookyMan" }); // Returns: Spookyman

    KeyDB.get("user_54321"); // Returns: { username: SomeUser }

    KeyDB.delete("user_12345"); // Returns: 1 (no. of deleted keys)

    KeyDB.all(); // Returns: [{ username: "SpookyMan" }, ...and_all_other_keys]
}

doSomething();
```

## Typescript

```ts
import { KeyDB } from "key.db";

const config: KeyDB.Utils.Config = {
    dialect: "postgres", // Can be any dialect
    username: "someuser",
    password: "youshallnotpass",
    host: "localhost",
    port: "8080"
}

const Database = KeyDB("database_name", config);

const doSomething = async () => {
    KeyDB.set("user_12345", { username: "SpookyMan" }); // Returns: Spookyman

    KeyDB.get("user_54321"); // Returns: { username: SomeUser }

    KeyDB.delete("user_12345"); // Returns: 1 (no. of deleted keys)

    KeyDB.all(); // Returns: [{ username: "SpookyMan" }, ...and_all_other_keys]
}

doSomething();
```