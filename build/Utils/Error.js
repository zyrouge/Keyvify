"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = void 0;
class Err extends Error {
    constructor(message, name) {
        super();
        this.name = `KeyDB_${name || "Error"}`;
        this.code = this.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.Err = Err;
