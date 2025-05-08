import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import type { Express, RequestHandler } from "express";

let sessionMiddleware: RequestHandler;
const configureSession = (app: Express) => {

   const store = new (connectPgSimple(session))({
    createTableIfMissing: true,
   });

   sessionMiddleware = session({
     store,
     secret: process.env.SESSION_SECRET!,
     saveUninitialized: false,
   });

   app.use(sessionMiddleware);
};

export default configureSession;
export { sessionMiddleware };