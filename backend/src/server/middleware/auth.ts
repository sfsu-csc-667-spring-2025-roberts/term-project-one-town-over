import { NextFunction, Request, Response } from "express";

const sessionMiddleware = (request: Request, response: Response, next: NextFunction) => { 
    //@ts-ignore
    if(request.session.userId !== undefined){
        //@ts-ignore
        response.locals.userId = request.session.userId;
    //@ts-ignore
        response.locals.userEmail = request.session.userEmail;
// @ts-ignore
        console.log("Session userEmail in middleware:", request.session.userEmail);

        next();
    } else {
        response.redirect("/auth/login");
    }
};

export {sessionMiddleware};