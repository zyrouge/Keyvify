import type Sequelize from "sequelize";

export function isInstalled(): boolean;
export function getDriver(): typeof Sequelize;