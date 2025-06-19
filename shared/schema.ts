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

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(), // openai, runway, pika, etc.
  keyName: text("key_name").notNull(), // OPENAI_API_KEY, RUNWAY_API_KEY, etc.
  keyValue: text("key_value").notNull(), // encrypted value
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vastServers = pgTable("vast_servers", {
  id: serial("id").primaryKey(),
  vastId: text("vast_id").notNull().unique(),
  name: text("name").notNull(),
  gpu: text("gpu").notNull(),
  gpuCount: integer("gpu_count").notNull(),
  cpuCores: integer("cpu_cores").notNull(),
  ram: integer("ram").notNull(), // in GB
  disk: integer("disk").notNull(), // in GB
  pricePerHour: text("price_per_hour").notNull(), // stored as string to preserve precision
  location: text("location").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  isLaunched: boolean("is_launched").notNull().default(false),
  launchedAt: timestamp("launched_at"),
  serverUrl: text("server_url"),
  sshConnection: text("ssh_connection"), // SSH connection string
  status: text("status").notNull().default("available"), // available, launching, running, stopping, stopped, configuring
  setupStatus: text("setup_status").default("pending"), // pending, installing, ready, failed
  comfyuiPort: integer("comfyui_port").default(8188),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const setupScripts = pgTable("setup_scripts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // comfyui, stable-diffusion, general
  script: text("script").notNull(), // bash script content
  isActive: boolean("is_active").notNull().default(true),
  estimatedTime: integer("estimated_time_minutes").default(10), // estimated execution time
  requirements: jsonb("requirements"), // system requirements
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serverExecutions = pgTable("server_executions", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => vastServers.id),
  scriptId: integer("script_id").notNull().references(() => setupScripts.id),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  output: text("output"), // script execution output
  errorLog: text("error_log"), // error messages
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVastServerSchema = createInsertSchema(vastServers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSetupScriptSchema = createInsertSchema(setupScripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServerExecutionSchema = createInsertSchema(serverExecutions).omit({
  id: true,
  createdAt: true,
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

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type VastServer = typeof vastServers.$inferSelect;
export type InsertVastServer = z.infer<typeof insertVastServerSchema>;

export type SetupScript = typeof setupScripts.$inferSelect;
export type InsertSetupScript = z.infer<typeof insertSetupScriptSchema>;

export type ServerExecution = typeof serverExecutions.$inferSelect;
export type InsertServerExecution = z.infer<typeof insertServerExecutionSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
