require("dotenv").config();
const express    = require("express");
const cookieParser = require("cookie-parser");
const connectDB  = require("./src/config/db");

const authRoutes     = require("./src/routes/authRoutes");
const userRoutes     = require("./src/routes/userRoutes");
const serviceRoutes  = require("./src/routes/serviceRoutes");
const providerRoutes = require("./src/routes/providerRoutes");
const requestRoutes  = require("./src/routes/requestRoutes");
const bidRoutes      = require("./src/routes/bidRoutes");
const reviewRoutes   = require("./src/routes/reviewRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const adminRoutes    = require("./src/routes/adminRoutes");

const { errorHandler, notFound } = require("./src/middleware/errorHandler");

const app = express();

// ── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/services",  serviceRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ success: true, message: "HomeServ API is running 🚀" })
);

// ── 404 & Error Handlers (always last) ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));