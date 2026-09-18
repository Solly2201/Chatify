import express from "express";
import cors from "cors";
import conversationRoutes from "./routes/conversationRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/conversations", conversationRoutes);

app.use(errorHandler);

export default app;
