type cc = [string, string];

const Constants = {
    INVALID_USERNAME: ["Invalid username", "INVALID_USERNAME"] as cc,
    INVALID_PASSWORD: ["Invalid password", "INVALID_PASSWORD"] as cc,
    INVALID_DATABASE: ["Invalid database", "INVALID_DATABASE"] as cc,
    INVALID_HOST: ["Invalid host", "INVALID_HOST"] as cc,
    INVALID_PORT: ["Invalid port", "INVALID_PORT"] as cc,
    INVALID_URI: ["Invalid URI", "INVALID_URI"] as cc,
    INVALID_STORAGE: ["Invalid storage", "INVALID_STORAGE"] as cc,
    INVALID_CACHE_OPTION: ["Invalid cache option", "INVALID_CACHE_OPTION"] as cc,
    INVALID_SERIALIZER: ["Invalid serializer", "INVALID_SERIALIZER"] as cc,
    INVALID_DESERIALIZER: ["Invalid deserializer", "INVALID_DESERIALIZER"] as cc,
    NO_DB_NAME: ["No database name was passed", "NO_DB_NAME"] as cc,
    INVALID_DB_NAME: ["Invalid database name was passed", "INVALID_DB_NAME"] as cc,
    NO_CONFIG: ["No config was passed", "NO_CONFIG"] as cc,
    NO_DIALECT: ["No dialect was passed", "NO_DIALECT"] as cc,
    INVALID_DIALECT: ["Invalid dialect was passed", "INVALID_DIALECT"] as cc,
    INVALID_SQL_DIALECT: ["Invalid SQL Dialect", "INVALID_SQL_DIALECT"] as cc,
    NO_SQLITE_STORAGE: ["No storage path was passed", "NO_SQLITE_STORAGE"] as cc,
    INVALID_SQLITE_STORAGE: ["Invalid storage path was passed", "INVALID_SQLITE_STORAGE"] as cc,
    ERROR_OPENING_CONNECTION: ["Could not open connection", "FAILED_TO_OPEN"] as cc,
    MISSING_MONGODB_URI: ["No Mongoose URI was passed", "MISSING_MONGODB_URI"] as cc,
    NO_KEY: ["No key was passed", "NO_KEY"] as cc,
    INVALID_KEY: ["Invalid key was passed", "INVALID_KEY"] as cc,
    NO_VALUE: ["No value was passed", "NO_VALUE"] as cc
}

export default Constants;