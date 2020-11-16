import { isArray, isBoolean, isString, get as ObjectGet, set as ObjectSet, pull as ArrayPull, isNumber } from "lodash";
import { BaseDB, isBaseDBInstance } from "../Managers/Base";
import serializeJavascript from "serialize-javascript";
import Constants from "./Constants";
import fs from "fs-extra";
import path from "path";
import { Err } from "./Error";

export function DefSerializer(input: any) {
    return serializeJavascript(input);
}

export function DefDeserializer(input: string) {
    return eval("(" + input + ")");
}

export type KeyAndNotation = [string, string];
export type KeyParams = string | KeyAndNotation;

export const getKey = ObjectGet;
export const setKey= ObjectSet;

export function parseKey(fullKey: string) {
    if(!fullKey) throw new Err(...Constants.NO_KEY);
    if (!isString(fullKey)) throw new Err(...Constants.NO_KEY);
    const [key, ...path] = fullKey.split(".");
    return [key, path.join(".")] as KeyParams;
}

export const pullValue = ArrayPull;

export type Operators = "+" | "-" | "*" | "/" | "%" | "**" |
    "add" | "addition" |
    "sub" | "subtract" | "subtraction" |
    "multi" | "multiply" | "multiplication" |
    "div" | "divide" | "diivision" |
    "mod" | "modulo" | "remind" | "reminder" |
    "exponent" | "exponential" | "raise" | "power";

const AddOperators = ["+", "add", "addition"];
const SubOperators = ["-", "sub" , "subtract" , "subtraction"];
const MultiOperators = ["*", "multi" , "multiply" , "multiplication"];
const DivideOperators = ["/", "div" , "divide" , "diivision"];
const ModOperators = ["%", "mod" , "modulo" , "remind" , "reminder"];
const ExpoOperators = ["**", "exponent" , "exponential" , "raise" , "power"];

export const OperatorsArray = [
    ...AddOperators,
    ...SubOperators,
    ...MultiOperators,
    ...DivideOperators,
    ...ModOperators,
    ...ExpoOperators
]

export function isValidMathOperator(op: string): op is Operators {
    if (OperatorsArray.includes(op)) return true;
    return false;
}

export function mathValue(val1:number, val2: number, op: string) {
    if (!isNumber(val1) || !isNumber(val2)) throw new Err(...Constants.INVALID_NUMBER);
    if (!isValidMathOperator(op)) throw new Err(...Constants.INVALID_MATH_OPERATOR);

    if (AddOperators.includes(op)) return val1 + val2;
    if (SubOperators.includes(op)) return val1 - val2;
    if (MultiOperators.includes(op)) return val1 * val2;
    if (DivideOperators.includes(op)) return val1 / val2;
    if (ModOperators.includes(op)) return val1 % val2;
    if (ExpoOperators.includes(op)) return val1 ** val2;
    else throw new Err(...Constants.INVALID_MATH_OPERATOR);
}

export function isKeyAndNotation(key: any): key is KeyAndNotation {
    if (!key) return false;
    if (isString(key) && isValidLiteral(key, true)) return true;
    if (isArray(key) && key.length === 2 && isString(key[0])) return true;
    return false;
}

export async function importData(database: BaseDB, file: string, replace: boolean = false) {
    if (!isBaseDBInstance) throw new Err(...Constants.INVALID_DIALECT);
    if (!file) throw new Err(...Constants.NO_FILE_PATH);
    if (!isString(file)) throw new Err(...Constants.INVALID_FILE_PATH);
    if (!isBoolean(replace)) throw new Err(...Constants.INVALID_REPLACE);

    let pth = file;
    if (!path.isAbsolute) pth = path.join(process.cwd(), file);
    if (!pth.endsWith(".json")) pth += ".json";
    if (!fs.existsSync(pth)) throw new Err(...Constants.FILE_DOES_NO_EXIST);

    const rawdata = await fs.readFile(pth);
    const ssdata: { key: string, value: string }[] = JSON.parse(rawdata.toString());
    const data = ssdata.map(d => ({ key: d.key, value: database.deserializer(d.value) }));
    for (const { key, value } of data) {
        const exists = await database.get(key);
        if (!exists || replace) await database.set(key, value);
    }
}

export async function exportData(database: BaseDB, file: string) {
    if (!isBaseDBInstance) throw new Err(...Constants.INVALID_DIALECT);
    if (!file) throw new Err(...Constants.NO_FILE_PATH);
    if (!isString(file)) throw new Err(...Constants.INVALID_FILE_PATH);

    let pth = file;
    if (!path.isAbsolute) pth = path.join(process.cwd(), file);
    if (!pth.endsWith(".json")) pth += ".json";
    await fs.ensureFile(pth);

    const unsdata = await database.all();
    const data = unsdata.map(d => ({ key: d.key, value: database.serializer(d.value) }));
    fs.writeFile(pth, JSON.stringify(data));
}

const alphabets = new Array(26).fill(null).map((n, i) => String.fromCharCode(65 + i)).join("");
const valid = [...alphabets, ...alphabets.toLowerCase(), ...new Array(10).fill(null).map((n, i) => `${i}`), "_"];

export function isValidLiteral(str: string, includeDot: boolean = false) {
    const check = [...valid];
    if (includeDot === true) check.push(".");
    return [...str].filter(s => !valid.includes(s)).length === 0;
}

export function normalize(str: string) {
    return [...str].map(s => valid.includes(s) ? s : "_").join("");
}