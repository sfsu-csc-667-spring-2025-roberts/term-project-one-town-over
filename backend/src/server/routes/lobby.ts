import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
  // Check if the request wants JSON
  if (
    request.headers.accept &&
    request.headers.accept.includes("application/json")
  ) {
    // Return JSON data
    return response.json({
      // @ts-ignore
      user: request.session.user || null,
    });
  }

  // Otherwise render the template as usual
  response.render("lobby");
});

export default router;
