const moduleName = "mongoose";

const isInstalled = () => {
    try {
        require.resolve(moduleName);
        return true;
    } catch (err) {
        return false;
    }
}

const getDriver = () => {
    if (!isInstalled()) throw new Error(`${moduleName} is not installed`);
    else return require(moduleName);
}

module.exports = {
    isInstalled,
    getDriver
}