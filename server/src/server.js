import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Start the API immediately; retry MongoDB in the background so
// temporary (in-memory) chats work even while the DB is coming up.
app.listen(PORT, () => console.log(`Chatify server running on http://localhost:${PORT}`));

async function connectWithRetry(attempt = 1) {
  try {
    await connectDB();
  } catch (err) {
    console.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}. Retrying in 10s...`);
    setTimeout(() => connectWithRetry(attempt + 1), 10000);
  }
}
connectWithRetry();
