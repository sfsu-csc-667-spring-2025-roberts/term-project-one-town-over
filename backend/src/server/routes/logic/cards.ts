import express from "express";
import { Request, Response } from "express";
import db from "../../db/connection";

const router = express.Router();

router.post("/createAllCards", async (request: Request, response: Response) => {
  const { round_id } = request.body;

  try {
    
    const suits = ["diamond", "heart", "spade", "club"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const queries = [];

    for (const suit of suits) {
        for (const value of values) {
            queries.push(`(${round_id}, '${suit}', '${value}')`);
        }
    }

    const allCards = await db.any(`
        INSERT INTO cards (round_id, color, name)
        VALUES ${queries.join(", ")}
        RETURNING *;
    `);

    response.status(201).json({
      success: true,
      message: "Cards created successfully",
      cards: allCards,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to create cards",
    });
  }
});

router.put("/showCard", async (request: Request, response: Response) => {
    const { card_id, is_hide } = request.body;
  
    try {
      const card = await db.one(
        `UPDATE cards SET is_hide = $1 WHERE card_id = $2 RETURNING *`,
        [is_hide, card_id]
      );
  
      response.status(201).json({
        success: true,
        message: "Card edited successfully",
        card: card,
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({
        success: false,
        message: "Failed to edit card",
      });
    }
  });

export default router;