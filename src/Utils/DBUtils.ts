import _, { isArray, isBoolean, isString } from "lodash";
import { BaseDB, isBaseDBInstance } from "../Managers/Base";
import Constants from "./Constants";
import fs from "fs-extra";
import path from "path";
import { Err } from "./Error";

export type KeyNdNotation = [string, string];
export type KeyParams = string | KeyNdNotation;

export const DotNotations = {
    get: _.get,
    set: _.set
}

export function isKeyNdNotation(key: any): key is KeyNdNotation {
    if (!key) return false;
    if (isString(key)) return true;
    if (isArray(key) && key.length === key.filter(k => isString(k)).length && key.length === 2) return true;
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