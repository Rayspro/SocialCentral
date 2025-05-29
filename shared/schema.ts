import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "youtube", "instagram", "twitter", "linkedin"
  displayName: text("display_name").notNull(),
  icon: text("icon").notNull(), // CSS class for icon
  color: text("color").notNull(), // Tailwind color class
  isActive: boolean("is_active").notNull().default(true),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  name: text("name").notNull(),
  username: text("username").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  externalId: text("external_id"),
  metadata: jsonb("metadata"), // platform-specific data like subscriber count, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "video", "image", "text"
  contentUrl: text("content_url"), // URL to generated content
  thumbnailUrl: text("thumbnail_url"),
  sourceText: text("source_text"), // original text for text-to-video
  generationPrompt: text("generation_prompt"), // AI prompt used
  status: text("status").notNull().default("draft"), // "draft", "pending", "approved", "rejected", "published"
  platformId: integer("platform_id").references(() => platforms.id),
  accountId: integer("account_id").references(() => accounts.id),
  metadata: jsonb("metadata"), // editing settings, filters, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => content.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "published", "failed"
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
});

// Types
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
