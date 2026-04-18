import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import conversationsRouter from "./conversations";
import postsRouter from "./posts";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(conversationsRouter);
router.use(postsRouter);
router.use(statsRouter);

export default router;
