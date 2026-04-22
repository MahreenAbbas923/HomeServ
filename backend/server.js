require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");

const authRoutes    = require("./src/routes/authRoutes");
const userRoutes    = require("./src/routes/userRoutes");
const serviceRoutes = require("./src/routes/serviceRoutes");   // ← NEW
// const providerRoutes = require("./src/routes/providerRoutes"); // next module

const { errorHandler, notFound } = require("./src/middleware/errorHandler");

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/services", serviceRoutes);   // ← NEW
// app.use("/api/providers", providerRoutes);

app.get("/", (req, res) =>
  res.json({ success: true, message: "HomeServ API is running 🚀" })
);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
