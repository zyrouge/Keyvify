type cc = [string, string];

const Constants = {
    NO_DB_NAME: ["No database name was passed", "NO_DB_NAME"] as cc,
    INVALID_DB_NAME: ["Invalid database name was passed", "INVALID_DB_NAME"] as cc,
    NO_CONFIG: ["No config was passed", "NO_CONFIG"] as cc,
    INVALID_DIALECT: ["Invalid dialect was passed", "INVALID_DIALECT"] as cc,
    INVALID_SQL_DIALECT: ["Invalid SQL Dialect", "INVALID_SQL_DIALECT"] as cc,
    NO_SQLITE_STORAGE: ["No storage path was passed", "NO_SQLITE_STORAGE"] as cc,
    INVALID_SQLITE_STORAGE: ["Invalid storage path was passed", "INVALID_SQLITE_STORAGE"] as cc,
    ERROR_OPENING_CONNECTION: ["Could not open connection", "FAILED_TO_OPEN"] as cc,
    MISSING_MONGODB_URI: ["No Mongoose URI was passed", "MISSING_MONGODB_URI"] as cc
}

export default Constants;