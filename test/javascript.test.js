const { KeyDB } = require("../build");

const database = KeyDB("database", {
    lool: "xd",
    dialect: "sqlite"
});

database.on("connect", () => {

});