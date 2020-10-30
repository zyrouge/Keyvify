"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Memory = void 0;
class Memory extends Map {
    constructor() {
        super();
        this.type = "Memory";
    }
    all() {
        return Object.entries(this).map(([key, value]) => ({ key, value }));
    }
}
exports.Memory = Memory;
