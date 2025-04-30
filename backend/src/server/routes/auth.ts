import express from "express";
import {Request, Response} from "express";

import  User from "../db/users"

const router = express.Router();

router.get("/register", async (_request: Request, response: Response) => {
    response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
    const {email, password, username} = request.body;

    try {
        // const userId = await User.register(email, password, username);
        const user = await User.register(email, password, username);
        
        // request.session.userId = userId;

        // response.redirect("/lobby")
        response.json(user);
    } catch(error) {
        // response.render("auth/register", {error: "Registration failed"});
        console.error(error);
        response.status(401).json({
            success: false,
            message: "Failed to register",
        });
    }
});

router.get("/login", async (_request: Request, response: Response) => {
    response.render("auth/login");
});

router.post("/login", async (request: Request, response: Response) => {
    const {email, password} = request.body;

    try{
        // const userId = await User.login(email, password);
        const user = await User.login(email, password);

        // request.session.userId = userId;

        // response.redirect("/lobby")
        response.json(user);
    }
    catch(error){
        // response.render("auth/login",{error: "Invalid email or password"});
        response.status(401).json({
            success: false,
            message: "Failed to login",
        });
    }
    
});

router.post("/logout", async (request: Request, response: Response) => {
    // request.session.userId = null;
    // request.session.destroy(()=> {
    //     response.redirect("/");
    // });

    // response.redirect("/");
    response.json("Logout successfull");
});

export default router;
