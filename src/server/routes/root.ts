import express from "express";

const router = express.Router();

router.get("/", (_request, response) => {
  response.render("root", { name: "Jrob's site" });
});

export default router;
