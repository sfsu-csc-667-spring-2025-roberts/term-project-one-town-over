import express from "express";
import {Request, Response} from "express";

import  User from "../db/users"

const router = express.Router();

router.get("/register", async (request: Request, response: Response) => {
    //@ts-ignore
    if (request.session.user) {
        return response.redirect("/lobby"); // Redirect logged-in users to the lobby
    }

    response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
    // const {email, password, username} = request.body;

    // try {
    //     const user = await User.register(email, password, username);

    //     response.json(user);
    // } catch(error) {
    //     console.error(error);
    //     response.status(401).json({
    //         success: false,
    //         message: "Failed to register",
    //     });
    // }
    const {email, password} = request.body;

    try{
        const user = await User.register(email, password);
        
        // @ts-ignore
        request.session.user = user;

        response.redirect("/lobby")
    }catch(error){
        response.render("auth/register", {error: "Registration failed"});
    }    
    
});

router.get("/login", async (request: Request, response: Response) => {

    //@ts-ignore
    if (request.session.user) {
        return response.redirect("/lobby"); // Redirect logged-in users to the lobby
    }

    response.render("auth/login");
});

router.post("/login", async (request: Request, response: Response) => {
    const {email, password} = request.body;

    try{
        const user = await User.login(email, password);

        // @ts-ignore
        request.session.user = user;

        console.log("Stored userEmail in session:", user.email); 

        response.redirect("/lobby")
        // response.json(user);
    }
    catch(error){
        response.render("auth/login",{error: "Invalid email or password"});
        // response.status(401).json({
        //     success: false,
        //     message: "Failed to login",
        // });
    }
    
});

router.get("/logout", async (request: Request, response: Response) => {
    // @ts-ignore
    request.session.user = null;
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
