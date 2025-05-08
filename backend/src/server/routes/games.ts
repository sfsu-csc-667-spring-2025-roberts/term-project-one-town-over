import express from 'express';
import { Request, Response, Router } from 'express';
import{Game} from '../db/index';
import { Server } from "socket.io";

const router = express.Router();

router.post("/create", async (request: Request, response: Response) => {
    //@ts-ignore
    const {id: userId, email } = request.session.user;
    const {gameName,   gameMinPlayers, gameMaxPlayers, gamePassword} = request.body;

        try {
            const gameId = await Game.create(userId, gameName, gameMinPlayers, gameMaxPlayers, gamePassword);
            
            if(gameId){

               request.app.get<Server>("io").emit("game-created", {
                    gameId, 
                    gameName: gameName?? `Game ${gameId}`, 
                    gameMinPlayers,
                    gameMaxPlayers, 
                    gamePassword: gamePassword !== undefined,
                    host: {
                        id: userId,
                        email,
                    },
                    });

                response.redirect(`/games/${gameId}`);
            } else {
                response.status(500).send("Error creating game");
            }
        } catch (error) {
            console.error("Error creating game:", error);
            response.status(500).send("Error creating game");
            
        }
    
});

router.post("/join", async (request: Request, response: Response) => {
    //@ts-ignore
    const {id: userId, email } = request.session.user;
    const {gameId, gamePassword} = request.body;

    try {
        const player_count = await Game.conditionalJoin(gameId, userId, gamePassword);
        
        const io = request.app.get<Server>("io");
        io.emit(`game:${gameId}:player-joined`, {player_count, userId, email});


        response.redirect(`/games/${gameId}`);
    } catch (error) {
        console.error("Error joining game:", error);
        response.status(500).send("Error joining game");
        
    }
}
);

router.get("/:gameId", async(request: Request, response: Response) => {
    const { gameId } = request.params;
    //@ts-ignore
    const userId = request.session.user?.id;

    if (!userId) {
        return response.redirect("/auth/login");
    }

    try {

        const isInGame = await Game.isPlayerInGame(parseInt(gameId), userId);

        if (!isInGame) {
            return response.redirect("/lobby");
        }

        const player_count = await Game.playerCount(parseInt(gameId));
        const players = await Game.getPlayersInGame(parseInt(gameId));
        const password = await Game.getGamePassword(parseInt(gameId));
        const name = await Game.getGameName(parseInt(gameId));

        response.render("games", {
            gameId,
            player_count,
            players,
            password,
            name,
            // @ts-ignore
            user: request.session.user,
        });
    } catch (error) {
        console.error("Error loading game page:", error);
        response.status(500).send("Failed to load game page");
    }

});

router.post("/leave", async (request: Request, response: Response): Promise<void> => {
    //@ts-ignore
    const userId = request.session.user?.id;
    const gameIdRaw = request.body.gameId;
    const gameId = parseInt(gameIdRaw, 10);

    if (!userId || isNaN(gameId)) {
        response.status(400).send("Invalid user or game ID");
    }

    try {
        await Game.leaveGame(gameId, userId);

        const io = request.app.get<Server>("io");
        io.emit(`game:${gameId}:player-left`, { userId });
        console.log("Player left, emitting event", gameId, userId);

        response.redirect("/lobby");
    } catch (error) {
        console.error("Error leaving game:", error);
        response.status(500).send("Failed to leave game");
    }
});

export default router;