import express from "express";
import { Request, Response } from "express";
import db from "../../db/connection";

const router = express.Router();

router.post("/createRoom", async (request: Request, response: Response) => {
  const { name } = request.body;

  try {
    await db.none(
      `INSERT INTO game_rooms(name, code) VALUES($1, $2)`,
      [name, name]
    );

    response.status(201).json({
      success: true,
      message: "Room created successfully",
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
});

router.get("/getRooms", async (request: Request, response: Response) => {

  try {
    const values = await db.any(`SELECT * FROM game_rooms`);

    response.json(values);
  } catch (error) {
    console.error(error);
    response.json("Failed to get rooms");
  }
});

export default router;
