import { pgTable, text, timestamp, jsonb, varchar, index, uuid, integer } from "drizzle-orm/pg-core";

// better-auth required tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// Vercel ai-chatbot schema: chat table (replaces conversations)
export const chat = pgTable("chat", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  visibility: varchar("visibility", { length: 20 }).notNull().default("private"),
}, (table) => [
  index("chat_user_idx").on(table.userId),
  index("chat_created_idx").on(table.createdAt),
]);

// Attachment type for file references
export type Attachment = {
  name: string;
  contentType: string;
  url: string;
};

// Message part types following AI SDK UIMessage format
// Extended with custom visualization type for semantic clarity
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: "tool-result"; toolCallId: string; toolName: string; result: unknown }
  | { type: "file"; url: string; name: string; mediaType: string }
  | { type: "visualization"; format: "png" | "svg" | "html"; url: string; metadata?: Record<string, unknown> };

// Vercel ai-chatbot schema: message table with UUID and attachments
export const message = pgTable("message", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => chat.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  parts: jsonb("parts").$type<MessagePart[]>().notNull(),
  attachments: jsonb("attachments").$type<Attachment[]>().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("message_chat_idx").on(table.chatId),
  index("message_created_idx").on(table.createdAt),
  index("message_parts_gin_idx").using("gin", table.parts),
]);

// Vercel ai-chatbot schema: document table for artifacts/canvas
export const document = pgTable("document", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  kind: varchar("kind", { length: 20 }).notNull(),
  content: text("content"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("document_user_idx").on(table.userId),
  index("document_created_idx").on(table.createdAt),
]);

// Vercel ai-chatbot schema: suggestion table for chat suggestions
export const suggestion = pgTable("suggestion", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => document.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  description: text("description"),
  isResolved: varchar("is_resolved", { length: 10 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("suggestion_document_idx").on(table.documentId),
  index("suggestion_user_idx").on(table.userId),
]);

// Vercel ai-chatbot schema: vote table for message feedback
export const vote = pgTable("vote", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => chat.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").notNull().references(() => message.id, { onDelete: "cascade" }),
  isUpvoted: varchar("is_upvoted", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("vote_chat_idx").on(table.chatId),
  index("vote_message_idx").on(table.messageId),
]);

// TypeScript types for Drizzle inference
export type Chat = typeof chat.$inferSelect;
export type Message = typeof message.$inferSelect;
export type Document = typeof document.$inferSelect;
export type Suggestion = typeof suggestion.$inferSelect;
export type Vote = typeof vote.$inferSelect;
