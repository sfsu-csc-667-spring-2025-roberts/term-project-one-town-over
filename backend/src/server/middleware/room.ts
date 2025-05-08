import { NextFunction, Request, Response } from "express";

const roomMiddleware = (request: Request, response: Response, next: NextFunction) => { 
    
    const {roomId} = request.params;
    if (roomId === undefined && request.url.includes("lobby")) {
        response.locals.roomId = 0;
    } 
    else if (roomId === undefined && request.url.includes("games")) {
        const match = request.url.match(/\/games\/(\d+)/);
        response.locals.roomId = match ? parseInt(match[1], 10) : undefined;
        console.log("Room ID from URL:", response.locals.roomId);
    } else if (roomId !== undefined) {
        response.locals.roomId = roomId;
    }

    const{player_count} = request.params;
    response.locals.player_count = player_count;
    console.log("Player count from URL:", response.locals.player_count);

    next();

};

export {roomMiddleware};