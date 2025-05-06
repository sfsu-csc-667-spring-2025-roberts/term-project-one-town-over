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

export default router;