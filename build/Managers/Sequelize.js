"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQL = void 0;
const sequelize_1 = require("sequelize");
const Base_1 = require("./Base");
const DataParser = __importStar(require("../Utils/DataParser"));
class SQL {
    constructor(name, config) {
        this.name = name;
        this.type = config.dialect;
        this.sequelize = config.sequelize || new sequelize_1.Sequelize({
            database: config.database,
            username: config.username,
            password: config.password,
            host: config.host,
            dialect: config.dialect,
            storage: config.storage
        });
        this.model = this.sequelize.define(this.name, {
            key: {
                primaryKey: true,
                type: sequelize_1.DataTypes.STRING
            },
            value: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            }
        });
        if (config.disableCache !== true)
            this.cache = new Base_1.Memory();
        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sequelize.authenticate();
            yield this.sequelize.sync();
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sequelize.close();
        });
    }
    get(key) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const cachev = (_a = this.cache) === null || _a === void 0 ? void 0 : _a.get(key);
            const mod = cachev || ((_b = (yield this.model.findByPk(key))) === null || _b === void 0 ? void 0 : _b.getDataValue("value")) || undefined;
            return mod ? this.deserializer(mod) : undefined;
        });
    }
    set(key, value) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const obj = { key, value: this.serializer(value) };
            yield this.model.findOrCreate({ where: obj });
            (_a = this.cache) === null || _a === void 0 ? void 0 : _a.set(obj.key, obj.value);
            return this.deserializer(obj.value);
        });
    }
    delete(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const totalDeleted = yield this.model.destroy({
                where: { key }
            });
            (_a = this.cache) === null || _a === void 0 ? void 0 : _a.delete(key);
            return totalDeleted || 0;
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const allMods = yield this.model.findAll();
            const allKeys = allMods.map(m => {
                const key = m.getDataValue("key");
                const rvalue = m.getDataValue("value");
                const value = rvalue ? this.deserializer(rvalue) : undefined;
                return { key, value };
            });
            if (this.cache) {
                allKeys.forEach(({ key, value }) => { var _a; return (_a = this.cache) === null || _a === void 0 ? void 0 : _a.set(key, value); });
                const cachedKeys = yield this.all();
                cachedKeys.forEach(({ key }) => { var _a; return (_a = this.cache) === null || _a === void 0 ? void 0 : _a.delete(key); });
            }
            return allKeys;
        });
    }
    entries() {
        var _a;
        return ((_a = this.cache) === null || _a === void 0 ? void 0 : _a.all()) || [];
    }
}
exports.SQL = SQL;
