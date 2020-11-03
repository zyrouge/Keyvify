const { Keyvify } = require("../build");

const database = Keyvify("database", {
    lool: "xd",
    dialect: "sqlite"
});

database.on("connect", () => {

});