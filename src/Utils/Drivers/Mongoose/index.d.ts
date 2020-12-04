import type Mongoose from "mongoose";

export function isInstalled(): boolean;
export function getDriver(): typeof Mongoose;