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
const DataParser = __importStar(require("../Utils/DataParser"));
class SQL {
    constructor(name, config) {
        this.name = name;
        this.type = config.dialect;
        this.sequelize = config.sequelize ? config.sequelize : new sequelize_1.Sequelize({
            database: config.database,
            username: config.username,
            password: config.password,
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
        this.serializer = config.serializer || DataParser.serialize;
        this.deserializer = config.deserializer || DataParser.deserialize;
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const mod = yield this.model.findByPk(key);
            const value = mod === null || mod === void 0 ? void 0 : mod.getDataValue("value");
            return value ? this.deserializer(value) : undefined;
        });
    }
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const obj = { key, value: this.serializer(value) };
            yield this.model.findOrCreate({ where: obj });
            return this.deserializer(obj.value);
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
            return allKeys;
        });
    }
}
exports.SQL = SQL;
