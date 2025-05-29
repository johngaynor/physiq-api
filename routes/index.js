module.exports = function (app) {
  app.use("/api/health", require("./health"));
};
