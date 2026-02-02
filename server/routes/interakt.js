import { Router } from "express";

const interaktRoutes = Router();

interaktRoutes.use("/webhook", (req, res) => {
  try {
    const payload = req.body;
    console.log(payload);
  } catch (err) {
    res.status(400).json({
      ok: false,
    });
  }
});

export default interaktRoutes;
