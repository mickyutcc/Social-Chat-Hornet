import { Router, type IRouter } from "express";
import { count } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db, usersTable, messagesTable, postsTable } from "@workspace/db";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ cnt: count() }).from(usersTable);
  const [onlineUsersResult] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(eq(usersTable.isOnline, true));
  const [totalMessagesResult] = await db.select({ cnt: count() }).from(messagesTable);
  const [totalPostsResult] = await db.select({ cnt: count() }).from(postsTable);
  const [premiumUsersResult] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(eq(usersTable.isPremium, true));

  res.json(
    GetStatsResponse.parse({
      totalUsers: totalUsersResult?.cnt ?? 0,
      onlineUsers: onlineUsersResult?.cnt ?? 0,
      totalMessages: totalMessagesResult?.cnt ?? 0,
      totalPosts: totalPostsResult?.cnt ?? 0,
      premiumUsers: premiumUsersResult?.cnt ?? 0,
    })
  );
});

export default router;
