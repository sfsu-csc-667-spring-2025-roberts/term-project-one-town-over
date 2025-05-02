import express from "express";

const router = express.Router();

router.get("/", (request, response) => {

  //@ts-ignore
  if (request.session.userId) {
    return response.redirect("/lobby"); // Redirect logged-in users to the lobby
  }
  
  response.render("root", { name: "Jrob's site" });
});

export default router;
