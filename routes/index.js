module.exports = function (app) {
  app.use("/api/health", require("./health"));
  app.use("/api/all", require("./all"));
};
