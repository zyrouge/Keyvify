# Installation

```console
$ npm install kv.db
```

# Installing a Dialect

Dialect | NPM Command
--- | ---
MySQL | `$ npm install mysql2`
Postgres |`$ npm install pg pg-hstore`
SQLite |`$ npm install sqlite3`
Better SQLite |`$ npm install better-sqlite3`
MongoDB |`$ npm install mongoose`
MariaDB |`$ npm install mariadb`
MSSQL |`$ npm install tedious`

# Importing

### CommonJS

```js
const { KVDB } = require("kv.db"); // Destructuring
// or
const KVDB = require("kv.db").KVDB;
```

### ModernJS and Typescript

```js
import { KVDB } from "kv.db";
// or
import KVDB from "kv.db"; // Default export
```