const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // needed for httpOnly cookies
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/team", require("./modules/team/team.routes"));
app.use("/api/projects", require("./modules/projects/projects.routes"));
app.use("/api/analytics", require("./modules/analytics/analytics.routes"));

app.use(errorHandler);

module.exports = app;
