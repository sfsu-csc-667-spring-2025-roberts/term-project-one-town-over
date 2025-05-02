import { Express } from 'express';
import { Server } from 'socket.io';
import {sessionMiddleware} from './sessions'; // Adjust the import path as necessary
const configureSockets = (io: Server, app: Express) => {
    app.set("io", io); // Set the io instance in the app object
    io.engine.use(sessionMiddleware); // Use the session middleware for socket.io

    io.on("connection", (socket) => {
        // @ts-ignore
        const {id, user} = socket.request.session;

       
        socket.join(user); // Join the socket to the user ID room
        socket.on("disconnect", () => {
        
        });// Join the socket to the session ID room
    });

};

export default configureSockets;