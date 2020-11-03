const { KVDB } = require("../build");

const database = KVDB("database", {
    lool: "xd",
    dialect: "sqlite"
});

database.on("connect", () => {

});