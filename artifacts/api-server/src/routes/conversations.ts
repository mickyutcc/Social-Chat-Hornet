import { Router, type IRouter } from "express";
import { eq, or, and, desc, count } from "drizzle-orm";
import { db, conversationsTable, messagesTable, usersTable } from "@workspace/db";
import {
  GetMessagesParams,
  GetMessagesQueryParams,
  GetMessagesResponse,
  SendMessageParams,
  SendMessageBody,
  ListConversationsResponse,
  StartConversationBody,
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

router.get("/conversations", async (req, res): Promise<void> => {
  const convs = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        eq(conversationsTable.user1Id, DEMO_USER_ID),
        eq(conversationsTable.user2Id, DEMO_USER_ID)
      )
    )
    .orderBy(desc(conversationsTable.updatedAt));

  const results = await Promise.all(
    convs.map(async (conv) => {
      const otherUserId = conv.user1Id === DEMO_USER_ID ? conv.user2Id : conv.user1Id;
      const [otherUser] = await db.select().from(usersTable).where(eq(usersTable.id, otherUserId));

      const msgs = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const [unreadResult] = await db
        .select({ cnt: count() })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conv.id),
            eq(messagesTable.isRead, false)
          )
        );

      const lastMsg = msgs[0];
      return {
        id: conv.id,
        otherUser: otherUser ? toUserShape(otherUser) : null,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
        unreadCount: unreadResult?.cnt ?? 0,
        createdAt: conv.createdAt,
      };
    })
  );

  const filtered = results.filter((r) => r.otherUser !== null);
  res.json(ListConversationsResponse.parse(filtered));
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = GetMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = GetMessagesQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt)
    .limit(limit)
    .offset(offset);

  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.conversationId, params.data.id),
        eq(messagesTable.isRead, false)
      )
    );

  res.json(GetMessagesResponse.parse(msgs));
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      senderId: DEMO_USER_ID,
      content: body.data.content,
      isRead: false,
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json(msg);
});

router.post("/conversations/start", async (req, res): Promise<void> => {
  const body = StartConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const targetUserId = body.data.userId;

  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        and(
          eq(conversationsTable.user1Id, DEMO_USER_ID),
          eq(conversationsTable.user2Id, targetUserId)
        ),
        and(
          eq(conversationsTable.user1Id, targetUserId),
          eq(conversationsTable.user2Id, DEMO_USER_ID)
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const conv = existing[0];
    const [otherUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    res.status(201).json({
      id: conv.id,
      otherUser: otherUser ? toUserShape(otherUser) : null,
      lastMessage: msgs[0]?.content ?? null,
      lastMessageAt: msgs[0]?.createdAt ?? null,
      unreadCount: 0,
      createdAt: conv.createdAt,
    });
    return;
  }

  const [conv] = await db
    .insert(conversationsTable)
    .values({ user1Id: DEMO_USER_ID, user2Id: targetUserId })
    .returning();

  const [otherUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));

  res.status(201).json({
    id: conv.id,
    otherUser: otherUser ? toUserShape(otherUser) : null,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: conv.createdAt,
  });
});

export default router;
