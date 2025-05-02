import express from "express";
import {Request, Response} from "express";
import bcrypt from "bcrypt";

import  User from "../db/users"

const router = express.Router();

router.get("/register", async (request: Request, response: Response) => {
    //@ts-ignore
    if (request.session.userId) {
        return response.redirect("/lobby"); // Redirect logged-in users to the lobby
    }

    response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
    const {email, password:password} = request.body;

    try{
        const userId = await User.register(email, password);
        

        // @ts-ignore
        request.session.userId = userId;
        // @ts-ignore
        request.session.userEmail = email;


        response.redirect("/lobby")
    }catch(error){
        response.render("auth/register", {error: "Registration failed"});
    }    
    
});

router.get("/login", async (request: Request, response: Response) => {

    //@ts-ignore
    if (request.session.userId) {
        return response.redirect("/lobby"); // Redirect logged-in users to the lobby
    }

    response.render("auth/login");

});

router.post("/login", async (request: Request, response: Response) => {
    const {email, password} = request.body;

    try{
        const userId = await User.login(email, password);
        // @ts-ignore
        request.session.userId = userId;
        // @ts-ignore
        request.session.userEmail = email;

        console.log("Stored userEmail in session:", email); 

        response.redirect("/lobby")
    }
    catch(error){
        response.render("auth/login",{error: "Invalid email or password"});
    }
    
});

router.get("/logout", async (request: Request, response: Response) => {
    // @ts-ignore
    request.session.userId = null;
    // @ts-ignore
    request.session.userEmail = null;
    request.session.destroy((err)=> {
        if (err) {
            console.error("Session destruction error:", err);
            return response.status(500).send("Failed to destroy session");
        }

        // Only redirect after session is successfully destroyed
        response.redirect("/");
    });

});

export default router;
