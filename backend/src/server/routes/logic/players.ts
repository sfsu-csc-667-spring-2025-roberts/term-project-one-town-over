import express from "express";
import { Request, Response } from "express";
import db from "../../db/connection";

const router = express.Router();

router.post("/createPlayer", async (request: Request, response: Response) => {
  const { user_id, room_id } = request.body;

  try {
    const newPlayer = await db.one(
      `INSERT INTO players(user_id, room_id) VALUES($1, $2) RETURNING *`,
      [user_id, room_id]
    );

    response.status(201).json({
      success: true,
      message: "Player created successfully",
      player: newPlayer,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to create player",
    });
  }
});

router.put("/editPlayerMoney", async (request: Request, response: Response) => {
  const {player_id, newMoney} = request.body;

  try {
    const player = await db.one(
      `UPDATE players SET money = $1 WHERE player_id = $2 RETURNING *`,
      [newMoney, player_id]
    );

    response.status(201).json({
      success: true,
      message: "Player's money edited successfully",
      player: player,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to edit player's money",
    });
  }
});

router.put("/editPlayerStatus", async (request: Request, response: Response) => {
  const {player_id, is_ready} = request.body;

  try {
    const player = await db.one(
      `UPDATE players SET is_ready = $1 WHERE player_id = $2 RETURNING *`,
      [is_ready, player_id]
    );

    response.status(201).json({
      success: true,
      message: "Player's status edited successfully",
      player: player,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to edit player's status",
    });
  }
});

export default router;