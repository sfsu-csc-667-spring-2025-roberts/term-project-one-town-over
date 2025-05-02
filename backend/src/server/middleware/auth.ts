import { NextFunction, Request, Response } from "express";

const sessionMiddleware = (request: Request, response: Response, next: NextFunction) => { 
    //@ts-ignore
    if(request.session.user) { // Check if the user is logged in
        //@ts-ignore
        response.locals.user = request.session.user; // Make the user available in response locals
// @ts-ignore
        console.log("Session userEmail in middleware:", request.session.user.email)// Log the user email to the console

        next();
    } else {
        response.redirect("/auth/login");
    }
};

export {sessionMiddleware};