import express from "express";
import cors from "cors";
import {
  badRequestHandler,
  unauthorizedHandler,
  forbiddenHandler,
  notFoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";
import usersRouter from "./services/users/index.js";
import chatRouter from "./services/chats/index.js";
import cookieParser from "cookie-parser";

const app = express();
const whitelist = [
  process.env.FE_DEV_URL,
  process.env.FE_PROD_URL,
  process.env.REDIRECT,
];

app.use(
  cors({
    origin: function (origin, next) {
      //cors is a global middleware - for each request
      console.log("ORIGIN: ", origin);
      // 0 \\ 0
      if (origin === undefined || whitelist.indexOf(origin) !== -1) {
        console.log("ORIGIN ALLOWED");
        next(null, true);
      } else {
        console.log("ORIGIN NOT ALLOWED");
        next(new Error("CORS ERROR!"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes

app.use("/users", usersRouter);
app.use("/chats", chatRouter);

// For test purposes

app.get("/test", (req, res) => {
  res.send({ message: "Hello, World!" });
});

// Error handlers

app.use(badRequestHandler);
app.use(unauthorizedHandler);
app.use(forbiddenHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);

export default app;
