import express from "express";
import { Request, Response } from "express";
import db from "../../db/connection";

const router = express.Router();

router.post("/createRound", async (request: Request, response: Response) => {
  const { room_id } = request.body;

  try {
    const newRound = await db.one(
      `INSERT INTO game_rounds(room_id) VALUES($1) RETURNING *`,
      [room_id]
    );

    response.status(201).json({
      success: true,
      message: "Round created successfully",
      round: newRound,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to create round",
    });
  }
});

router.put("/editRoundStage", async (request: Request, response: Response) => {
  const {round_id, new_stage} = request.body;

  try {
    const round = await db.one(
      `UPDATE game_rounds SET current_stage = $1 WHERE round_id = $2 RETURNING *`,
      [new_stage, round_id]
    );

    response.status(200).json({
      success: true,
      message: "Round's stage edited successfully",
      round: round,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to edit round's stage",
    });
  }
});

router.put("/editRoundMoney", async (request: Request, response: Response) => {
  const {round_id, new_money} = request.body;

  try {
    const round = await db.one(
      `UPDATE game_rounds SET round_money = $1 WHERE round_id = $2 RETURNING *`,
      [new_money, round_id]
    );

    response.status(200).json({
      success: true,
      message: "Round's money edited successfully",
      round: round,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to edit round's money",
    });
  }
});

export default router;