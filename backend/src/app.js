import "dotenv/config";
import cors from "cors";
import express from "express";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(",") ?? "*"
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
