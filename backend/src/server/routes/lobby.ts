import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
   // @ts-ignore
   const userEmail = request.session.userEmail;

   console.log("User email passed to view:", userEmail);

   response.render("lobby", { email: userEmail });
});

export default router;
