# Basic Usage

## Javascript

```js
const { Keyvify } = require("keyvify");

const config = {
    dialect: "postgres", // Can be any dialect name or instance
    username: "someuser",
    password: "youshallnotpass",
    host: "localhost",
    port: "8080"
}

const Database = Keyvify("database_name", config);

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
import { Keyvify } from "keyvify";

const config: Keyvify.Utils.Config = {
    dialect: "postgres", // Can be any dialect name or instance
    username: "someuser",
    password: "youshallnotpass",
    host: "localhost",
    port: "8080"
}

const Database = Keyvify("database_name", config);

const doSomething = async () => {
    Database.set("user_12345", { username: "SpookyMan" }); // Returns: Spookyman

    Database.get("user_54321"); // Returns: { username: SomeUser }

    Database.delete("user_12345"); // Returns: 1 (no. of deleted keys)

    Database.all(); // Returns: [{ username: "SpookyMan" }, ...and_all_other_keys]
}

doSomething();
```