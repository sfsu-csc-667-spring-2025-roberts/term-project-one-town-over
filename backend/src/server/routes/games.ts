import express from "express";
import { Request, Response, Router } from "express";
import { Game } from "../db/index";
import { Server } from "socket.io";
import db from "../db/connection";

interface GameRecord {
  id: number;
  name: string;
  max_players: number;
  player_count: string;
}

const router = express.Router();

router.post("/create", async (request: Request, response: Response) => {
  //@ts-ignore
  const { id: userId, email } = request.session.user;
  const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } =
    request.body;

  try {
    const gameId = await Game.create(
      userId,
      gameName,
      gameMinPlayers,
      gameMaxPlayers,
      gamePassword
    );

    if (gameId) {
      request.app.get<Server>("io").emit("game-created", {
        gameId,
        gameName: gameName ?? `Game ${gameId}`,
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
  const { id: userId, email } = request.session.user;
  const { gameId, gamePassword } = request.body;

  try {
    const player_count = await Game.conditionalJoin(
      gameId,
      userId,
      gamePassword
    );

    const io = request.app.get<Server>("io");
    io.emit(`game:${gameId}:player-joined`, { player_count, userId, email });

    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.error("Error joining game:", error);
    response.status(500).send("Error joining game");
  }
});

router.get("/list", async (request: Request, response: Response) => {
  try {
    const availableGames = await db.any<GameRecord>(`
            SELECT g.id, g.name, g.max_players, 
            (SELECT COUNT(*) FROM "game-players-test" gp WHERE gp.game_id = g.id) as player_count
            FROM "games-test" g
        `);

    const games = availableGames.map((game: GameRecord) => ({
      id: game.id,
      name: game.name,
      players: parseInt(game.player_count),
      maxPlayers: game.max_players,
      status: "waiting", // You would need to add a status field to your database
      createdAt: new Date().toISOString(),
    }));

    response.json({ games });
  } catch (error) {
    console.error("Error fetching games:", error);
    response.status(500).json({ error: "Failed to fetch games" });
  }
});

router.get("/:gameId", async (request: Request, response: Response) => {
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

    // Check if the request wants JSON
    if (
      request.headers.accept &&
      request.headers.accept.includes("application/json")
    ) {
      return response.json({
        gameId,
        player_count,
        players,
        name,
        // @ts-ignore
        user: request.session.user,
      });
    }

    // Otherwise render the template as usual
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
    if (
      request.headers.accept &&
      request.headers.accept.includes("application/json")
    ) {
      response.status(500).json({ error: "Failed to load game" });
    } else {
      response.status(500).send("Failed to load game page");
    }
  }
});

router.post(
  "/leave",
  async (request: Request, response: Response): Promise<void> => {
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
  }
);

export default router;
