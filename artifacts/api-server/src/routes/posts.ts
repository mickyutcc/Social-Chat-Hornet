import { Router, type IRouter } from "express";
import { eq, desc, count, and, sql } from "drizzle-orm";
import { db, postsTable, postLikesTable, usersTable } from "@workspace/db";
import {
  ListPostsQueryParams,
  ListPostsResponse,
  CreatePostBody,
  DeletePostParams,
  LikePostParams,
  LikePostResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function toUserShape(user: typeof usersTable.$inferSelect) {
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
    distanceKm: null,
    isOnline: user.isOnline,
    isPremium: user.isPremium,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

router.get("/posts", async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const results = await Promise.all(
    posts.map(async (post) => {
      const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.authorId));
      const [likesResult] = await db
        .select({ cnt: count() })
        .from(postLikesTable)
        .where(eq(postLikesTable.postId, post.id));
      const liked = await db
        .select()
        .from(postLikesTable)
        .where(and(eq(postLikesTable.postId, post.id), eq(postLikesTable.userId, DEMO_USER_ID)))
        .limit(1);

      return {
        id: post.id,
        authorId: post.authorId,
        author: author ? toUserShape(author) : null,
        content: post.content,
        imageUrl: post.imageUrl,
        likesCount: likesResult?.cnt ?? 0,
        isLiked: liked.length > 0,
        createdAt: post.createdAt,
      };
    })
  );

  res.json(ListPostsResponse.parse(results));
});

router.post("/posts", async (req, res): Promise<void> => {
  const body = CreatePostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      authorId: DEMO_USER_ID,
      content: body.data.content,
      imageUrl: body.data.imageUrl ?? null,
    })
    .returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));

  res.status(201).json({
    id: post.id,
    authorId: post.authorId,
    author: author ? toUserShape(author) : null,
    content: post.content,
    imageUrl: post.imageUrl,
    likesCount: 0,
    isLiked: false,
    createdAt: post.createdAt,
  });
});

router.delete("/posts/:id", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(postLikesTable).where(eq(postLikesTable.postId, params.data.id));
  await db.delete(postsTable).where(eq(postsTable.id, params.data.id));

  res.sendStatus(204);
});

router.post("/posts/:id/like", async (req, res): Promise<void> => {
  const params = LikePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(postLikesTable)
    .where(and(eq(postLikesTable.postId, params.data.id), eq(postLikesTable.userId, DEMO_USER_ID)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(postLikesTable)
      .where(and(eq(postLikesTable.postId, params.data.id), eq(postLikesTable.userId, DEMO_USER_ID)));
    res.json(LikePostResponse.parse({ success: true, message: "Unliked" }));
  } else {
    await db.insert(postLikesTable).values({ postId: params.data.id, userId: DEMO_USER_ID });
    res.json(LikePostResponse.parse({ success: true, message: "Liked" }));
  }
});

export default router;
