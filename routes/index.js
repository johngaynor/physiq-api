module.exports = function (app) {
  app.use("/api/health", require("./health"));
  app.use("/api/diet", require("./diet"));
  app.use("/api/checkins", require("./checkins"));
  app.use("/api/all", require("./all"));
};
