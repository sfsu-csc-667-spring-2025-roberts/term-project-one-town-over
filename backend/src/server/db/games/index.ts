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
        SELECT player_id, email 
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

const createCard = async (gameId: number, color: string, name: string) => {
  return db.any(
      `INSERT INTO cards(game_id, color, name) VALUES($1, $2, $3) RETURNING *`,
      [gameId, color, name]
  );
};

const createCommunityCards = async (gameId: number, cards: number[]) => {
  return db.none(
      `INSERT INTO community_cards(game_id, card1, card2, card3, card4, card5) VALUES($1, $2, $3, $4, $5, $6)`,
      [gameId, ...cards]
  );
};

const assignPlayerCards = async (playerId: number, card1Id: number, card2Id: number) => {
  return db.none(
    `UPDATE "game-players-test" SET card1 = $1, card2 = $2 WHERE player_id = $3`,
    [card1Id, card2Id, playerId]
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
  isPlayerInGame,
  leaveGame,
  changeRound,
  createCard,
  createCommunityCards,
  assignPlayerCards,
};
