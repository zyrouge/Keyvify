"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserialize = exports.serialize = void 0;
var serialize_javascript_1 = __importDefault(require("serialize-javascript"));
function serialize(input) {
    return serialize_javascript_1.default(input);
}
exports.serialize = serialize;
function deserialize(input) {
    return eval("(" + input + ")");
}
exports.deserialize = deserialize;
