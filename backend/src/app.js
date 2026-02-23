import "dotenv/config";
import cors from "cors";
import express from "express";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*"
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "FitAura API healthy" });
});

app.use("/api", analyzeRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
