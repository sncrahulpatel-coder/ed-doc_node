import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import errorHandler from "./middleware/errorHandler.js";
import rrnMiddleware from "./middleware/rrnMiddleware.js";

import adminRoutes from "./routes/adminRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import logMiddleware from "./utils/logMiddleware.js";
import ipLogger from "./config/ip_logger.js";
import securityLogRouter from "./config/securityLog.js";
import { login } from "./controller/authControllers.js";
import "./controller/cron.js";
import { extractFormFields } from "./ChatGPT/chatGPT.js";

const app = express();

// Rate limiter configuration for DOS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.isProd == 'true' ? 1000:2000, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 409,
    error: "Too many requests from this IP, please try again later.",
    data:{
      message:"Too many requests from this IP, please try again later."
    }
  },
  handler: (req, res, next, options) => {
    // Custom handler that sends a 409 status code
    res.status(409).json({
      status: 409,
      error: "Too many requests from this IP, please try again later.",
      data: {
        message: "Too many requests from this IP, please try again later."
      }
    });
  }
});

// Middlewares
app.use(limiter);       // Apply rate limiter first
app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: process.env.isProd == 'true' ? "https://lms.snckids.in" : "*"
}));
app.use(morgan("dev"));
app.use(rrnMiddleware);
app.use(logMiddleware);
// app.use(ipLogger); // ✅ plug in IP counter


// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/securityError", securityLogRouter);
app.post('/login',login)

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the API 🚀" });
});

app.get('/GptCheck', async (req, res) => {
  const responce = await extractFormFields('uploads/formImages/demo.jpg');
  res.status(200).json({ message: "GPT is working fine 🚀" ,responce});
})


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// Error handler
app.use(errorHandler);

export default app;
