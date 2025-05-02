import {Request, Response} from "express";
import express from "express";
import type {ChatMessage} from "../../types/global";

const router = express.Router();

router.post("/:id", (request: Request, response: Response) => {
    const {message} = request.body;
    const id = request.params.id;
    const io = request.app.get("io");

    const broadcastMessage: ChatMessage = {
        message,
        // @ts-ignore
        sender: request.session.user.email,
        timestamp: Date.now(),
    }


    console.log({broadcastMessage});

    io.emit(`chat-message:${id}`, broadcastMessage);

    response.status(200).send();
});    

export default router;
