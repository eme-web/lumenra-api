import { Router } from "express";

import authRouter from "./auth.js";
import aiRoutes from "./ai.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to lumenra APIs",
  });
});

router.use("/auth", authRouter);
router.use("/ai", aiRoutes);

export default router;
