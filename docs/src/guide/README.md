# Installation

```console
$ npm install key.db
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
const { KeyDB } = require("key.db"); // Destructuring
// or
const KeyDB = require("key.db").KeyDB;
```

### ModernJS and Typescript

```js
import { KeyDB } from "key.db";
// or
import KeyDB from "key.db"; // Default export
```