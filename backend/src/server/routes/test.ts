import express from "express";
import {Request, Response} from "express";
import db from "../db/connection";
import users from "../db/users";
import type {Server} from "socket.io";

const router = express.Router();

router.get("/", async (_request, response) => {
    try{

        await db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
            `Test string ${new Date().toISOString()}`,
        ]);

        response.json(await db.any("SELECT * FROM test_table"));

    } catch(error){
        console.log(error);
    }
});


router.get("/socket", (request: Request, response: Response) => {
    const io: Server = request.app.get("io"); // Get the io instance from the app object
    //@ts-ignore
    io.emit("test", {user: request.session.user} ); // Emit a test event to all connected sockets
    // @ts-ignore
    io.to(request.session.user.id).emit("test", {secret: " hi"} ); // Emit a test event to the specific user socket
    response.json({message: "Socket event emitted!"}); // Send a response to the client
});

export default router;
