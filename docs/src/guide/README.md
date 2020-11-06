# Installation

```console
$ npm install keyvify
```

# Installing a Dialect

Dialect | NPM Command
--- | ---
MySQL | `$ npm install mysql2`
Postgres | `$ npm install pg pg-hstore`
SQLite | `$ npm install sqlite3`
Better SQLite | `$ npm install better-sqlite3`
MongoDB | `$ npm install mongoose`
MariaDB | `$ npm install mariadb`
MSSQL | `$ npm install tedious`
Custom | Check their corresponding docs

# Importing

### CommonJS

```js
const { Keyvify } = require("keyvify"); // Destructuring
// or
const Keyvify = require("keyvify").Keyvify;
```

### ModernJS and Typescript

```js
import { Keyvify } from "keyvify";
// or
import Keyvify from "keyvify"; // Default export
```