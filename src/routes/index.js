import { Router } from "express";

import authRouter from "./auth.js";
import aiRoutes from "./ai.js";
import categoryRouter from "./category.js";
import moduleRouter from "./module.js";
import moduleContentRouter from "./moduleContent.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to lumenra APIs",
  });
});

router.use("/auth", authRouter);
router.use("/ai", aiRoutes);
router.use("/category", categoryRouter);
router.use("/module", moduleRouter);
router.use("/module-content", moduleContentRouter);

export default router;
