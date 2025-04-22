import express from "express";
import dotenv from "dotenv";
import { timeMiddleware } from "./middleware/time";
import rootRoutes from "./routes/root";
import httpErrors from "http-errors";
import * as path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const pool = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.Port || 3000;

const myfunc = async () => {
  const result = await pool.query('SELECT * FROM users;');
  console.log("Result: ", result);
};

myfunc();

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(timeMiddleware);

app.use(express.static(path.join(process.cwd(), "src", "public")));

app.use(express.static(path.join(process.cwd(), "src", "public")));

app.use(cookieParser());

app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);

app.use((_request, response, next) => {
  next(httpErrors(404));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
