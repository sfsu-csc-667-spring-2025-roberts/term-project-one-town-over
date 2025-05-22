import db from "../connection";

const CREATE_SQL = `INSERT INTO "games-test" (name, min_players, max_players, password) VALUES ($1, $2, $3, $4) RETURNING id`;

const create = async (
  creator: number,
  name?: string,
  min?: number,
  max?: number,
  password?: string
) => {
  const { id } = await db.one(CREATE_SQL, [name, min, max, password]);
  await join(id, creator, true);

  return id;
};

const JOIN_SQL = `
INSERT INTO "game-players-test" (game_id, player_id, is_host) VALUES ($1, $2, $3)`;

const join = async (gameId: number, userId: number, isHost = false) => {
  await db.none(JOIN_SQL, [gameId, userId, isHost]);
};

export const CONDITIONAL_JOIN_SQL = `
INSERT INTO "game-players-test" (game_id, player_id)
SELECT $(gameId), $(userId) 
WHERE NOT EXISTS (
  SELECT 'value-doesnt-matter' 
  FROM "game-players-test"
  WHERE game_id=$(gameId) AND player_id=$(userId)
)
AND (
  SELECT COUNT(*) FROM "games-test" WHERE id=$(gameId) AND password=$(password)
) = 1
AND (
  (
    SELECT COUNT(*) FROM "game-players-test" WHERE game_id=$(gameId)
  ) < (
    SELECT max_players FROM "games-test" WHERE id=$(gameId)
  )
)
RETURNING (
  SELECT COUNT(*) FROM "game-players-test" WHERE game_id=$(gameId)
)
`;

const conditionalJoin = async (
  gameId: number,
  userId: number,
  password: string = ""
) => {
  const { player_count } = await db.one(CONDITIONAL_JOIN_SQL, {
    gameId,
    userId,
    password,
  });

  return player_count;
};

const playerCount = async (gameId: number) => {
  const { count } = await db.one(
    `SELECT COUNT(*) FROM "game-players-test" WHERE game_id = $1`,
    [gameId]
  );
  return parseInt(count, 10);
};

const getPlayersInGame = async (gameId: number) => {
  return db.any(
    `
        SELECT * 
        FROM "game-players-test" o
        JOIN "usertest" u ON o.player_id = u.id
        WHERE o.game_id = $1
    `,
    [gameId]
  );
};

const getGamePassword = async (gameId: number) => {
  const { password } = await db.one(
    `SELECT password FROM "games-test" WHERE id = $1`,
    [gameId]
  );
  return password;
};

const hasPassword = async (gameId: number) => {
  const { password } = await db.one(
    `SELECT password FROM "games-test" WHERE id = $1`,
    [gameId]
  );
  return !!password && password.trim() !== "";
};

const getGameName = async (gameId: number) => {
  const { name } = await db.one(`SELECT name FROM "games-test" WHERE id = $1`, [
    gameId,
  ]);
  return name;
};

const getGameRound = async (gameId: number) => {
  const { round } = await db.one(`SELECT round FROM "games-test" WHERE id = $1`, [
    gameId,
  ]);
  return round;
};

const getGamePot = async (gameId: number) => {
  const { pot } = await db.one(`SELECT pot FROM "games-test" WHERE id = $1`, [
    gameId,
  ]);
  return pot;
};

const isPlayerInGame = async (gameId: number, userId: number) => {
  const { count } = await db.one(
    `
        SELECT COUNT(*) FROM "game-players-test"
        WHERE game_id = $1 AND player_id = $2
    `,
    [gameId, userId]
  );
  return parseInt(count, 10) > 0;
};

const leaveGame = async (gameId: number, userId: number) => {
  return db.none(
    `DELETE FROM "game-players-test" WHERE game_id = $1 AND player_id = $2`,
    [gameId, userId]
  );
};

const changeRound = async (gameId: number, newRound: string) => {
  return db.none(
    `UPDATE "games-test" SET round = $2 WHERE id = $1`,
    [gameId, newRound]
  );
};

const createCard = async (gameId: number, suit: string, value: string) => {
  return db.any(
      `INSERT INTO cards(game_id, suit, value) VALUES($1, $2, $3) RETURNING *`,
      [gameId, suit, value]
  );
};

const createCommunityCards = async (gameId: number, cards: number[]) => {
  const existing = await db.oneOrNone(
    `SELECT community_id FROM community_cards WHERE game_id = $1`,
    [gameId]
  );

  if (existing) {
    return db.none(
      `UPDATE community_cards 
       SET card1 = $2, card2 = $3, card3 = $4, card4 = $5, card5 = $6
       WHERE game_id = $1`,
      [gameId, ...cards]
    );
  } else {
    return db.none(
      `INSERT INTO community_cards (game_id, card1, card2, card3, card4, card5)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameId, ...cards]
    );
  }
};

const assignPlayerCards = async (playerId: number, card1Id: number, card2Id: number) => {
  return db.none(
    `UPDATE "game-players-test" SET card1 = $1, card2 = $2 WHERE player_id = $3`,
    [card1Id, card2Id, playerId]
  );
};

const getCurrentTurn = async (gameId: number): Promise<string | null> => {
  const result = await db.oneOrNone(`SELECT current_turn FROM "games-test" WHERE id = $1`, [gameId]);
  return result?.current_turn ?? null;
};

const setCurrentTurn = async (gameId: number, playerId: string): Promise<void> => {
  await db.none(
    `UPDATE "games-test" SET current_turn = $2 WHERE id = $1`,
    [gameId, playerId]
  );
};

const placeBet = async (playerId: string, amount: number, gameId: number) => {
  return db.none(
    `UPDATE "game-players-test" SET current_bet = current_bet + $1, chips = chips - $1 WHERE player_id = $2 AND game_id = $3`,
    [amount, playerId, gameId]
  );
};

const updateGameBet = async (gameId: string, amount: number) => {
  return db.none(
    `UPDATE "games-test" SET current_bet = current_bet + $1 WHERE id = $2`,
    [amount, gameId]
  );
};


const getGameById = async (gameId: number) => {
  return db.one(
    `SELECT * FROM "games-test" WHERE id = $1`,
    [gameId]
  );
}

const getPlayerById = async (playerId: number, gameId: number) => {
  return db.one(
    `SELECT * FROM "game-players-test" WHERE player_id = $1 AND game_id = $2`,
    [playerId, gameId]
  );
}

const startGame = async (gameId: number) => {
  return db.none(
    `UPDATE "games-test" SET status = 'playing' WHERE id = $1`,
    [gameId]
  );
}

const setHasActed = async (playerId: string, hasActed: boolean = true) => {
  await db.query(
    `UPDATE "game-players-test" SET has_acted = $1 WHERE player_id = $2`,
    [hasActed, playerId]
  );
};

const resetPlayerActions = async (gameId: number) => {
  await db.query(
    `
    UPDATE "game-players-test"
    SET
      has_acted = FALSE
    WHERE game_id = $1
    `,
    [gameId]
  );
};

const getCommunityCards = async (gameId: number) => {
  return await db.query(
    `
    SELECT *
    FROM community_cards
    WHERE game_id = $1
    `,
    [gameId]
  );
};

const addChipsToPlayer = async (playerId: string, amount: number, gameId: number) => {
  await db.query(
    `
    UPDATE "game-players-test"
    SET chips = chips + $1
    WHERE player_id = $2 AND game_id = $3
    `,
    [amount, playerId, gameId]
  );
};

const getCardById = async (cardId: number) => {
  return await db.one(
    `
    SELECT *
    FROM cards  
    WHERE card_id = $1
    `,
    [cardId]
  );
};

const updateGameShowdown = async (gameId: number) => {
  await db.none(
    `
    UPDATE "games-test"
    SET pot = 0,
        current_bet = 0
    WHERE id = $1
    `,
    [gameId]
  );
};

const setPlayerFolded = async (playerId: number, gameId: number, folded: boolean) => {
  await db.none(
    `UPDATE "game-players-test" SET has_folded = $3 WHERE player_id = $1 AND game_id = $2`,
    [playerId, gameId, folded]
  );
};

const getActivePlayersInGame = async (gameId: number) => {
  return await db.any(
    `SELECT * FROM "game-players-test" WHERE game_id = $1 AND has_folded = FALSE AND chips > 0`,
    [gameId]
  );
}

const setGamePot = async (gameId: number, pot: number) => {
  await db.none(
    `UPDATE "games-test" SET pot = $2 WHERE id = $1`,
    [gameId, pot]
  );
};

const setGameCurrentBet = async (gameId: number, currentBet: number) => {
  await db.none(
    `UPDATE "games-test" SET current_bet = $2 WHERE id = $1`,
    [gameId, currentBet]
  );
};

const setPlayerCurrentBet = async (playerId: number, gameId: number, bet: number) => {
  await db.none(
    `UPDATE "game-players-test" SET current_bet = $3 WHERE player_id = $1 AND game_id = $2`,
    [playerId, gameId, bet]
  );
};

const eliminatePlayer = async (playerId: number, gameId: number) => {
  await db.none(
    `UPDATE "game-players-test" SET has_loose = true WHERE player_id = $1 AND game_id = $2`,
    [playerId, gameId]
  );
};

export default {
  create,
  join,
  conditionalJoin,
  playerCount,
  getPlayersInGame,
  getGamePassword,
  hasPassword,
  getGameName,
  getGameRound,
  getGamePot,
  isPlayerInGame,
  leaveGame,
  changeRound,
  createCard,
  createCommunityCards,
  assignPlayerCards,
  getCurrentTurn,
  setCurrentTurn,
  placeBet,
  getGameById,
  getPlayerById,
  updateGameBet,
  startGame,
  setHasActed,
  resetPlayerActions,
  getCommunityCards,
  addChipsToPlayer,
  getCardById,
  updateGameShowdown,
  setPlayerFolded,
  getActivePlayersInGame,
  setGamePot,
  setGameCurrentBet,
  setPlayerCurrentBet,
  eliminatePlayer
};
