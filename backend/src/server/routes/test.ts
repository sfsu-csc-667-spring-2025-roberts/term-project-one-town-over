import express from "express";
import {Request, Response} from "express";
import db from "../db/connection";

const router = express.Router();

router.get("/", async (_request, response) => {
    try{

        await db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
            `Test string ${new Date().toISOString()}`,
        ]);

        response.json(await db.any("SELECT * FROM test_table"));

    } catch(error){
        console.log(error);
    }
});

export default router;
