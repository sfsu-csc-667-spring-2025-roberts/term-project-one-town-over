import express from "express";
import { Request, Response, Router } from "express";
import { Game } from "../db/index";
import { Server } from "socket.io";
import db from "../db/connection";
import { Card, Player, createDeck, evaluateHands, shuffle } from "./logic/hands";

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

    const game = await Game.getGameById(parseInt(gameId));

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
        game
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

const changeRound = async (gameId: number, req: Request): Promise<void> => {
  const actualRound = await Game.getGameRound(gameId);

  let newRound: string;

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

  const io = req.app.get<Server>("io");

  // Always load and prepare community cards
  const communityResult = await db.one(
    `SELECT * FROM community_cards WHERE game_id = $1`,
    [gameId]
  );

  const cardIds = [
    communityResult.card1,
    communityResult.card2,
    communityResult.card3,
    communityResult.card4,
    communityResult.card5,
  ];

  const allCommunityCards: Card[] = await Promise.all(
    cardIds.map(async (id) => {
      const card = await Game.getCardById(id);
      if (!card) throw new Error(`Community card with ID ${id} not found`);
      return {
        suit: card.suit as Card['suit'],
        value: card.value as Card['value'],
      };
    })
  );

  // Determine how many cards should be revealed in the current round
  const revealedCountByRound: Record<string, number> = {
    "pre-flop": 0,
    "flop": 3,
    "turn": 4,
    "river": 5,
    "showdown": 5,
  };

  const communityCardsWithVisibility = allCommunityCards.map((card, index) => ({
    ...card,
    isHide: index >= revealedCountByRound[newRound],
  }));

  if (newRound === "showdown") {
    const players = await Game.getPlayersInGame(gameId);

    const formattedPlayers: Player[] = await Promise.all(
      players.map(async (player) => {
        const holeCardIds = [player.card1, player.card2];
        const holeCards = await Promise.all(
          holeCardIds.map(async (id) => {
            const card = await Game.getCardById(id);
            if (!card) throw new Error(`Card with ID ${id} not found for player ${player.player_id}`);
            return {
              suit: card.suit as Card['suit'],
              value: card.value as Card['value'],
            };
          })
        );

        return {
          id: player.player_id,
          holeCards,
        };
      })
    );

    const results = evaluateHands(formattedPlayers, allCommunityCards);

    const totalPot = await Game.getGamePot(gameId);
    const winners = results.winners;
    const chipsPerWinner = Math.floor(totalPot / winners.length);

    for (const winner of winners) {
      await Game.addChipsToPlayer(winner.id, chipsPerWinner);
    }

    await Game.updateGameShowdown(gameId);

    const winnersIdAndChips = await Promise.all(
      winners.map(async (w) => {
        const updatedPlayer = await Game.getPlayerById(parseInt(w.id), gameId);
        return {
          id: updatedPlayer.player_id,
          chips: updatedPlayer.chips,
        };
      })
    );

    io.emit(`game:${gameId}:showdown`, {
      pot: 0,
      currentBet: 0,
      winnersId: winnersIdAndChips,
    });
  }

  await Game.resetPlayerActions(gameId);
  await Game.changeRound(gameId, newRound);

  io.emit(`game:${gameId}:change-round`, {
    newRound,
    communityCards: communityCardsWithVisibility,
  });
};

const maybeChangeRound = async (gameId: number, req: Request): Promise<void> => {
  const players = await Game.getPlayersInGame(gameId);

  const activePlayers = players.filter((p: any) => !p.has_folded);
  const allActed = activePlayers.every((p: any) => p.has_acted);

  if (allActed) {
    await changeRound(gameId, req);

    const firstActivePlayer = activePlayers[0];
    await Game.setCurrentTurn(gameId, firstActivePlayer.player_id);
    const io = req.app.get<Server>("io");
    io.emit(`game:${gameId}:change-turn`, { newPlayer: firstActivePlayer.player_id });
  }
};

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

const dealCards = async (
  gameId: number,
  hideCards: boolean,
  req: Request
) => {
  const deck = shuffle(createDeck());

  try {
    const playersFromDb = await Game.getPlayersInGame(gameId);

    const players: any[] = [];

    for (const player of playersFromDb) {
      const holeCards = [deck.pop()!, deck.pop()!];

      const insertedCard1 = await Game.createCard(gameId, holeCards[0].suit, holeCards[0].value);
      const insertedCard2 = await Game.createCard(gameId, holeCards[1].suit, holeCards[1].value);

      const card1Id = insertedCard1[0].card_id;
      const card2Id = insertedCard2[0].card_id;

      await Game.assignPlayerCards(player.player_id, card1Id, card2Id);

      players.push({
        id: player.player_id,
        email: player.email,
        holeCards: hideCards ? ["hidden", "hidden"] : holeCards,
        actualCards: hideCards ? holeCards : undefined,
      });
    }

    const communityCards = [
      deck.pop()!,
      deck.pop()!,
      deck.pop()!,
      deck.pop()!,
      deck.pop()!,
    ];

    const communityCardIds: number[] = [];

    for (const card of communityCards) {
      const insertedCard = await Game.createCard(gameId, card.suit, card.value);
      communityCardIds.push(insertedCard[0].card_id);
    }

    await Game.createCommunityCards(gameId, communityCardIds);

    console.log("Players: ", players);

    const io = req.app.get<Server>("io");
    io.emit(`game:${gameId}:deal`, {players, communityCards});
  } catch (error) {
    console.error("Deal error:", error);
  }
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

      await Game.setHasActed(playerId);
      await changeTurn(gameId, playerId, req);
      await maybeChangeRound(gameId, req);

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
    await Game.placeBet(playerId, amount, gameId);
    await Game.updateGameBet(gameId, amount);
    await Game.setHasActed(playerId);
    await changeTurn(gameId, playerId, req);
    await maybeChangeRound(gameId, req);

    const io = req.app.get<Server>("io");

    io.emit(`game:${gameId}:bet`, {
      playerId,
      amount,
    });

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
    console.log("", playerId, gameId);

    await Game.placeBet(playerId, amount, gameId);
    await Game.updateGameBet(gameId, amount);
    await Game.setHasActed(playerId);
    await changeTurn(gameId, playerId, req);
    await maybeChangeRound(gameId, req);

    const io = req.app.get<Server>("io");

    io.emit(`game:${gameId}:raise`, {
      playerId,
      amount,
    });

    res.status(200).json({ message: "Player raised successfully" });
  } catch (error) {
    console.error("Raise error:", error);
    res.status(500).json({ error: "Internal server error during raise" });
  }
});

router.post("/call", async (req: Request, res: Response) => {
  const { gameId, playerId } = req.body;

  if (!gameId || !playerId) {
    console.error("Call: Invalid id");
    return res.status(400).json({ error: "Missing gameId or playerId" });
  }

  try {
    const game = await Game.getGameById(gameId);
    const player = await Game.getPlayerById(playerId, gameId);

    const callAmount = game.current_bet - player.current_bet;

    console.log("Player current bet: ", player.current_bet);
    console.log("Game current bet", game.current_bet);

    if (callAmount <= 0 || callAmount > player.chips) {
      console.error(`Call: Invalid amount ---\nCall amount: ${callAmount}\nChips player: ${player.chips}`);
      return res.status(400).json({ error: "Invalid call amount" });
    }

    await Game.placeBet(playerId, callAmount, gameId);
    await Game.setHasActed(playerId);
    await changeTurn(gameId, playerId, req);
    await maybeChangeRound(gameId, req);

    const io = req.app.get<Server>("io");

    io.emit(`game:${gameId}:call`, {
      playerId,
      callAmount,
    });

    res.status(200).json({ message: "Player called successfully" });
  } catch (error) {
    console.error("Call error:", error);
    res.status(500).json({ error: "Internal server error during call" });
  }
});

router.post("/start", async (req: Request, res: Response) => {
  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: "Missing gameId" });
  }

  try {
    await Game.startGame(gameId);

    await dealCards(gameId, true, req);

    const players = await Game.getPlayersInGame(gameId);

    if (!players || players.length === 0) {
      return res.status(400).json({ error: "No players in the game" });
    }

    const firstPlayerId = players[0].player_id;

    await Game.setCurrentTurn(gameId, firstPlayerId);

    const io = req.app.get<Server>("io");
    io.emit(`game:${gameId}:start`, { gameId });
    io.emit(`game:${gameId}:change-turn`, { newPlayer: firstPlayerId });

    res.status(200).json({ message: "Game started successfully" });
  } catch (error) {
    console.error("Start error:", error);
    res.status(500).json({ error: "Internal server error during start" });
  }
});

export default router;
