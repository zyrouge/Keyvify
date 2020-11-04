# Using custom Dialects and Cache

## CommonJS

```js
const { Keyvify } = require("keyvify");
const { CustomDatabase, CustomCache } = require("./Custom");

const config = {
    // Custom dialect
    dialect: CustomDatabase,
    // or
    dialect: new CustomDatabase(), // dont forget to pass necessary arguments

    // Custom cache
    cache: CustomCache,
    // or
    cache: new CustomCache(), // dont forget to pass necessary arguments
}

const Database = Keyvify("database_name", config);
```

## Typescript

```ts
import { Keyvify } from "keyvify";
import { CustomDatabase, CustomCache } from "./Custom";

const config: Keyvify.Utils.Config = {
    // Custom dialect
    dialect: CustomDatabase,
    // or
    dialect: new CustomDatabase(), // dont forget to pass necessary arguments

    // Custom cache
    cache: CustomCache,
    // or
    cache: new CustomCache(), // dont forget to pass necessary arguments
}

const Database = Keyvify("database_name", config);
```

It's that simple!