import type SQLite from "better-sqlite3";

export function isInstalled(): boolean;
export function getDriver(): typeof SQLite;