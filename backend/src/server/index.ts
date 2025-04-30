import express from "express";
import dotenv from "dotenv";
import httpErrors from "http-errors";
import * as path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import livereload from "livereload";
import connectLivereload from "connect-livereload";
import * as routes from "./routes";
import { setupSession } from "./config/sessions";
import { sessionMiddleware } from "./middleware/auth";


dotenv.config();
const app = express();
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

const PORT = process.env.Port || 3000;

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));


app.use(cookieParser());

app.use("/public", express.static(path.join(process.cwd(), "public")));

app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

app.use("/", routes.root);
app.use("/test", routes.test);
app.use("/auth", routes.auth);

app.use("/lobby", sessionMiddleware, routes.lobby);


app.use((_request, response, next) => {
  next(httpErrors(404));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
