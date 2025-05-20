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
  const { gameId, gamePassword = "" } = request.body;

  try {
    // First check if the player is already in the game
    const isInGame = await Game.isPlayerInGame(parseInt(gameId), userId);
    if (isInGame) {
      return response.redirect(`/games/${gameId}`);
    }

    // Check if the game exists
    const gameExists = await checkGameExists(parseInt(gameId));
    if (!gameExists) {
      return response.status(404).json({ error: "Game not found" });
    }

    // Check if the game is full
    const currentPlayers = await Game.playerCount(parseInt(gameId));
    const maxPlayers = await getGameMaxPlayers(parseInt(gameId));
    if (currentPlayers >= maxPlayers) {
      return response.status(400).json({ error: "Game is full" });
    }

    // Check if password is correct
    const correctPassword = await checkGamePassword(
      parseInt(gameId),
      gamePassword
    );
    if (!correctPassword) {
      return response.status(403).json({ error: "Incorrect password" });
    }

    // Join the game
    await Game.join(parseInt(gameId), userId);
    const player_count = await Game.playerCount(parseInt(gameId));

    const io = request.app.get<Server>("io");
    io.emit(`game:${gameId}:player-joined`, { player_count, userId, email });

    // Respond based on request type
    if (
      request.headers.accept &&
      request.headers.accept.includes("application/json")
    ) {
      return response.json({ success: true, redirect: `/games/${gameId}` });
    } else {
      return response.redirect(`/games/${gameId}`);
    }
  } catch (error) {
    console.error("Error joining game:", error);
    if (
      request.headers.accept &&
      request.headers.accept.includes("application/json")
    ) {
      return response.status(500).json({ error: "Error joining game" });
    } else {
      return response.status(500).send("Error joining game");
    }
  }
});

// Helper functions
async function checkGameExists(gameId: number) {
  try {
    const { count } = await db.one(
      `SELECT COUNT(*) FROM "games-test" WHERE id = $1`,
      [gameId]
    );
    return parseInt(count, 10) > 0;
  } catch (error) {
    return false;
  }
}

async function getGameMaxPlayers(gameId: number) {
  try {
    const { max_players } = await db.one(
      `SELECT max_players FROM "games-test" WHERE id = $1`,
      [gameId]
    );
    return max_players;
  } catch (error) {
    return 0;
  }
}

async function checkGamePassword(gameId: number, password: string) {
  try {
    // Get the stored password
    const { password: storedPassword } = await db.one(
      `SELECT password FROM "games-test" WHERE id = $1`,
      [gameId]
    );

    // If there's no password on the game, any password is valid
    if (!storedPassword) {
      return true;
    }

    // Otherwise, passwords must match exactly
    return storedPassword === password;
  } catch (error) {
    console.error("Error checking game password:", error);
    return false;
  }
}

router.get("/list", async (request: Request, response: Response) => {
  try {
    const availableGames = await db.any<
      GameRecord & { password: string | null }
    >(
      `SELECT g.id, g.name, g.max_players, g.password,
      (SELECT COUNT(*) FROM "game-players-test" gp WHERE gp.game_id = g.id) as player_count
      FROM "games-test" g`
    );

    const games = availableGames.map((game) => ({
      id: game.id,
      name: game.name,
      players: parseInt(game.player_count),
      maxPlayers: game.max_players,
      status: "waiting", // You would need to add a status field to your database
      hasPassword: !!game.password && game.password.trim() !== "",
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
    const round = await Game.getGameRound(parseInt(gameId));

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
        round,
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
      round,
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

router.post(
  "/changeRound",
  async (request: Request, response: Response): Promise<void> => {
    //@ts-ignore
    const gameIdRaw = request.body.gameId;
    const actualRound = await Game.getGameRound(parseInt(gameIdRaw));

    if (isNaN(gameIdRaw)) {
      response.status(400).send("Invalid game ID");
    }

    let newRound;

    switch (actualRound) {
      case "pre-flop":
        newRound = "flop";
        break;
      case "flop":
        newRound = "turn";
        break;
      case "turn":
        newRound = "river";
        break;
      case "river":
        newRound = "showdown";
        break;
      default:
        newRound = "pre-flop";
    }

    try {
      await Game.changeRound(gameIdRaw, newRound);

      const io = request.app.get<Server>("io");
      io.emit(`game:${gameIdRaw}:change-round`, {newRound: newRound});
      response.status(200).json({ message: "Update successful: round" });
    } catch (error) {
      console.error("Error changing round:", error);
      response.status(500).send("Failed to change round");
    }
  }
);

router.post(
  "/changeTurn",
  async (req: Request, res: Response): Promise<void> => {
    const gameId = Number(req.body.gameId);
    if (isNaN(gameId)) {
      res.status(400).send("Invalid game ID");
    }

    try {
      const players = await Game.getPlayersInGame(gameId);
      const currentTurn = await Game.getCurrentTurn(gameId);

      const currentIndex = players.findIndex(p => p.player_id === currentTurn);

      let nextPlayer = null;
      for (let i = 1; i <= players.length; i++) {
        const nextIndex = (currentIndex + i) % players.length;
        const candidate = players[nextIndex];
        if (!candidate.hasFolded) {
          nextPlayer = candidate;
          break;
        }
      }

      if (!nextPlayer) {
        res.status(404).send("No active player found to assign turn to");
      }

      await Game.setCurrentTurn(gameId, nextPlayer.player_id);

      const io = req.app.get<Server>("io");
      io.emit(`game:${gameId}:change-turn`, { newPlayer: nextPlayer.player_id });

      res.status(200).json({ message: "Turn updated", newPlayer: nextPlayer.player_id });
    } catch (error) {
      console.error("Error changing turn:", error);
      res.status(500).send("Failed to change turn");
    }
  }
);

const changeTurn = async (
  gameId: number,
  currentPlayerId: string,
  req: Request
) => {

  const io = req.app.get<Server>("io");

  const players = await Game.getPlayersInGame(gameId);
  if (!players || players.length === 0) throw new Error("No players found");

  const currentIndex = players.findIndex(p => p.player_id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayerId = players[nextIndex].player_id;

  await Game.setCurrentTurn(gameId, nextPlayerId);

  io.emit(`game:${gameId}:change-turn`, {
    newPlayer: nextPlayerId,
  });

  return nextPlayerId;
};

router.post(
  "/check",
  async (req: Request, res: Response): Promise<void> => {
    const gameId = Number(req.body.gameId);
    const playerId = req.body.playerId;

    if (isNaN(gameId) || !playerId) {
      res.status(400).send("Invalid game ID or missing player ID");
    }

    try {
      const io = req.app.get<Server>("io");

      io.emit(`game:${gameId}:check`, {
        playerId,
        action: "check",
      });

      await changeTurn(gameId, playerId, req);

      res.status(200).json({ message: "Player checked and turn updated" });
    } catch (error) {
      console.error("Error during check/turn change:", error);
      res.status(500).send("Failed to check or change turn");
    }
  }
);

router.post("/bet", async (req: Request, res: Response) => {
  const { gameId, playerId, amount } = req.body;

  if (!gameId || !playerId || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid input for betting" });
  }

  try {
    await Game.placeBet(playerId, amount);
    await Game.updateGameBet(gameId, amount);

    const io = req.app.get<Server>("io");

    io.emit(`game:${gameId}:bet`, {
      playerId,
      amount,
    });

    await changeTurn(gameId, playerId, req);

    res.status(200).json({ message: "Bet placed and turn updated" });
  } catch (error) {
    console.error("Error during bet:", error);
    res.status(500).json({ error: "Failed to process bet" });
  }
});

router.post("/raise", async (req: Request, res: Response) => {
  const { gameId, playerId, amount } = req.body;

  if (!gameId || !playerId || !amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid raise parameters." });
  }

  try {
    await Game.placeBet(playerId, amount);
    await Game.updateGameBet(gameId, amount);

    const io = req.app.get<Server>("io");

    io.emit(`game:${gameId}:raise`, {
      playerId,
      amount,
    });

    await changeTurn(gameId, playerId, req);

    res.status(200).json({ message: "Player raised successfully" });
  } catch (error) {
    console.error("Raise error:", error);
    res.status(500).json({ error: "Internal server error during raise" });
  }
});

router.post("/call", async (req: Request, res: Response) => {
  const { gameId, playerId } = req.body;

  if (!gameId || !playerId) {
    return res.status(400).json({ error: "Missing gameId or playerId" });
  }

  try {
    const game = await Game.getGameById(gameId);
    const player = await Game.getPlayerById(playerId);

    const callAmount = game.current_bet - player.current_bet;

    if (callAmount <= 0 || callAmount > player.chips) {
      return res.status(400).json({ error: "Invalid call amount" });
    }

    await Game.placeBet(playerId, callAmount);

    const io = req.app.get<Server>("io");

    io.emit(`game:${gameId}:call`, {
      playerId,
      callAmount,
    });

    await changeTurn(gameId, playerId, req);

    res.status(200).json({ message: "Player called successfully" });
  } catch (error) {
    console.error("Call error:", error);
    res.status(500).json({ error: "Internal server error during call" });
  }
});

export default router;
