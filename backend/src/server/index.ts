import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import httpErrors from "http-errors";
import * as path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import livereload from "livereload";
import connectLivereload from "connect-livereload";
import * as routes from "./routes";
import setupSession from "./config/sessions";
import { authMiddleware } from "./middleware/auth";
import { roomMiddleware } from "./middleware/room"; 
import configureSockets from "./config/sockets";
import * as http from "http";
import { Server } from "socket.io";


import { timeMiddleware } from "./middleware/time";
import rootRoutes from "./routes/root";

const pool = require("./db");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.Port || 3000;


const myfunc = async () => {
  const result = await pool.query('SELECT * FROM users;');
  console.log("Result: ", result);
};

myfunc();

app.use(morgan("dev"));


if(process.env.NODE_ENV !== "production") {
  const reloadServer = livereload.createServer();

  reloadServer.watch(path.join(process.cwd(), "public", "js"));

  reloadServer.server.once("connection", () =>{
    setTimeout(()=> {
      reloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLivereload());
}

setupSession(app);
configureSockets(io, app);


app.use(morgan("dev"));


app.use(cors());
app.use(express.json());

app.use(timeMiddleware);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/public", express.static(path.join(process.cwd(), "public")));

app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");


app.use("/", routes.root);
app.use("/test", routes.test);
app.use("/auth", routes.auth);

app.use("/lobby", authMiddleware, routes.lobby);
app.use("/chat", authMiddleware, routes.chat);
app.use("/games", authMiddleware, routes.games);




app.use("/api", rootRoutes);

app.use(express.static(path.join(process.cwd(), "..", "frontend", "build")));


app.get('/', (req: Request, res: Response): void => {
  res.sendFile(path.join(process.cwd(), "..", "frontend", "build", "index.html"));
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});
