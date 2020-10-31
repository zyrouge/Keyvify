const fs = require("fs");

const all = fs.readdirSync(".");
all.forEach(f => {
    if (f !== "docs") fs.rmSync(`./${f}`);
});