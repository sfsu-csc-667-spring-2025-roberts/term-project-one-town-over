import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { timeMiddleware } from "./middleware/time";
import rootRoutes from "./routes/root";

dotenv.config();

const app = express();
const port: number = 5000;

app.use(cors());
app.use(express.json());
app.use(timeMiddleware);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

app.use("/api", rootRoutes);

app.use(express.static(path.join(process.cwd(), "..", "frontend", "build")));

app.get('/', (req: Request, res: Response): void => {
  res.sendFile(path.join(process.cwd(), "..", "frontend", "build", "index.html"));
});

app.listen(port, '0.0.0.0', (): void => {
  console.log(`Server is running on http://localhost:${port}`);
});
