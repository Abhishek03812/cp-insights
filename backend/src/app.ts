import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import profilesRouter from "./routes/profiles";
import analyticsRouter from "./routes/analytics";
import intelligenceRouter from "./routes/intelligence";
import authRouter from "./routes/auth";

// Ensure worker is loaded so BullMQ starts processing
import "./workers/syncWorker"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/intelligence", intelligenceRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
