module.exports = function (app) {
  app.use("/api/health", require("./health"));
  app.use("/api/diet", require("./diet"));
  app.use("/api/checkins", require("./checkins"));
  app.use("/api/physique", require("./physique"));
  app.use("/api/all", require("./all"));
  app.use("/api/ai", require("./ai"));
  app.use("/api/training", require("./training"));
  app.use("/api/journals", require("./journals"));
  app.use("/api/settings", require("./settings"));
  app.use("/api/phases", require("./phases"));
  app.use("/api/supplements", require("./supplements"));
};
