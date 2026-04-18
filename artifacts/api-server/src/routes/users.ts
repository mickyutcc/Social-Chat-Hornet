import { Router, type IRouter } from "express";
import { eq, ne, sql, and, or, ilike } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetUserParams,
  GetUserResponse,
  ListUsersQueryParams,
  ListUsersResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  BlockUserParams,
  BlockUserResponse,
  ReportUserParams,
  ReportUserBody,
  ReportUserResponse,
  GetMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_USER_ID = 1;

function toUserResponse(user: typeof usersTable.$inferSelect, distanceKm?: number | null) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    age: user.age,
    location: user.location,
    lat: user.lat,
    lng: user.lng,
    distanceKm: distanceKm ?? null,
    isOnline: user.isOnline,
    isPremium: user.isPremium,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

router.get("/me", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse(toUserResponse(user)));
});

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { search, limit = 20, offset = 0 } = params.data;

  const conditions = [ne(usersTable.id, DEMO_USER_ID)];

  if (search) {
    conditions.push(
      or(
        ilike(usersTable.displayName, `%${search}%`),
        ilike(usersTable.username, `%${search}%`),
        ilike(usersTable.location, `%${search}%`)
      )!
    );
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(and(...conditions))
    .orderBy(sql`CASE WHEN ${usersTable.isOnline} THEN 0 ELSE 1 END`, usersTable.id)
    .limit(limit ?? 20)
    .offset(offset ?? 0);

  res.json(ListUsersResponse.parse(users.map((u) => toUserResponse(u))));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse(toUserResponse(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (body.data.displayName != null) updateData.displayName = body.data.displayName;
  if (body.data.bio !== undefined) updateData.bio = body.data.bio;
  if (body.data.avatarUrl !== undefined) updateData.avatarUrl = body.data.avatarUrl;
  if (body.data.age !== undefined) updateData.age = body.data.age;
  if (body.data.location !== undefined) updateData.location = body.data.location;
  if (body.data.lat !== undefined) updateData.lat = body.data.lat;
  if (body.data.lng !== undefined) updateData.lng = body.data.lng;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserResponse.parse(toUserResponse(updated)));
});

router.post("/users/:id/block", async (req, res): Promise<void> => {
  const params = BlockUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  req.log.info({ blockedUserId: params.data.id }, "User blocked");
  res.json(BlockUserResponse.parse({ success: true, message: "User blocked successfully" }));
});

router.post("/users/:id/report", async (req, res): Promise<void> => {
  const params = ReportUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ReportUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  req.log.info({ reportedUserId: params.data.id, reason: body.data.reason }, "User reported");
  res.json(ReportUserResponse.parse({ success: true, message: "User reported successfully" }));
});

export default router;
