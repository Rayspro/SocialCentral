import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  schedulerActive: boolean("scheduler_active").default(false),
  schedulerChecks: integer("scheduler_checks").default(0),
  schedulerStarted: timestamp("scheduler_started"),
  schedulerLastCheck: timestamp("scheduler_last_check"),
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

// ComfyUI Models table
export const comfyModels = pgTable("comfy_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  folder: text("folder").notNull(), // checkpoints, loras, vae, etc.
  description: text("description"),
  serverId: integer("server_id"),
  status: text("status").notNull().default("pending"), // pending, downloading, ready, failed
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  downloadProgress: integer("download_progress").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ComfyUI Workflows table
export const comfyWorkflows = pgTable("comfy_workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  workflowJson: text("workflow_json").notNull(), // JSON workflow definition
  isTemplate: boolean("is_template").default(false),
  category: text("category").default("text-to-image"), // text-to-image, image-to-image, etc.
  serverId: integer("server_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ComfyUI Generations table
export const comfyGenerations = pgTable("comfy_generations", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  workflowId: integer("workflow_id"),
  prompt: text("prompt"),
  negativePrompt: text("negative_prompt"),
  parameters: text("parameters"), // JSON parameters
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  imageUrls: text("image_urls").array(),
  queueId: text("queue_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// User preferences and behavior tracking
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  preferredStyles: jsonb("preferred_styles"), // ["realistic", "anime", "abstract"]
  favoritePromptTypes: jsonb("favorite_prompt_types"), // ["portrait", "landscape", "character"]
  usagePatterns: jsonb("usage_patterns"), // frequency, time of day, etc.
  skillLevel: text("skill_level").notNull().default("beginner"), // "beginner", "intermediate", "advanced"
  interests: jsonb("interests"), // ["photography", "digital_art", "concept_art"]
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow recommendations generated by AI
export const workflowRecommendations = pgTable("workflow_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  workflowId: integer("workflow_id").references(() => comfyWorkflows.id),
  recommendationType: text("recommendation_type").notNull(), // "personal", "trending", "similar_users"
  confidence: integer("confidence").notNull(), // 0-100
  reasoning: text("reasoning").notNull(), // AI explanation
  promptSuggestions: jsonb("prompt_suggestions"), // suggested prompts for this workflow
  isViewed: boolean("is_viewed").notNull().default(false),
  isUsed: boolean("is_used").notNull().default(false),
  userFeedback: text("user_feedback"), // "helpful", "not_helpful", "excellent"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // recommendations can expire
});

// User interaction tracking for ML
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // "generation", "workflow_view", "model_download"
  entityType: text("entity_type").notNull(), // "workflow", "generation", "model"
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata"), // action-specific data
  sessionId: text("session_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
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

export const insertComfyModelSchema = createInsertSchema(comfyModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComfyWorkflowSchema = createInsertSchema(comfyWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComfyGenerationSchema = createInsertSchema(comfyGenerations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
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

export type ComfyModel = typeof comfyModels.$inferSelect;
export type InsertComfyModel = z.infer<typeof insertComfyModelSchema>;

export type ComfyWorkflow = typeof comfyWorkflows.$inferSelect;
export type InsertComfyWorkflow = z.infer<typeof insertComfyWorkflowSchema>;

export type ComfyGeneration = typeof comfyGenerations.$inferSelect;
export type InsertComfyGeneration = z.infer<typeof insertComfyGenerationSchema>;

// Add insert schemas for new tables
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowRecommendationSchema = createInsertSchema(workflowRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  timestamp: true,
});

// Add types for new tables
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type WorkflowRecommendation = typeof workflowRecommendations.$inferSelect;
export type InsertWorkflowRecommendation = z.infer<typeof insertWorkflowRecommendationSchema>;

export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;

// Audit Log table for tracking all system events
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource: text("resource").notNull(), // server, comfy_generation, user, etc.
  resourceId: text("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Additional context and metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  severity: text("severity").notNull().default("info"), // info, warning, error, critical
  category: text("category").notNull().default("user_action"), // user_action, system_event, security_event
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Workflow Analysis table for tracking model requirements
export const workflowAnalysis = pgTable("workflow_analysis", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  workflowName: text("workflow_name").notNull(),
  workflowJson: text("workflow_json").notNull(),
  requiredModels: jsonb("required_models").notNull(), // Array of required model info
  missingModels: jsonb("missing_models").notNull(), // Array of missing models
  analysisStatus: text("analysis_status").notNull().default("pending"), // pending, completed, failed
  downloadStatus: text("download_status").notNull().default("pending"), // pending, downloading, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkflowAnalysisSchema = createInsertSchema(workflowAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WorkflowAnalysis = typeof workflowAnalysis.$inferSelect;
export type InsertWorkflowAnalysis = z.infer<typeof insertWorkflowAnalysisSchema>;

// Server Mood Configurations
export const serverMoods = pgTable("server_moods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(), // Lucide icon name
  color: text("color").notNull(), // Tailwind color class
  category: text("category").notNull(), // "productivity", "gaming", "ai", "development"
  configuration: jsonb("configuration").notNull(), // Settings to apply
  isBuiltIn: boolean("is_built_in").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Server Mood Applications (history of applied moods)
export const serverMoodApplications = pgTable("server_mood_applications", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => vastServers.id),
  moodId: integer("mood_id").notNull().references(() => serverMoods.id),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  appliedBy: integer("applied_by").references(() => users.id),
  previousConfiguration: jsonb("previous_configuration"), // Backup of previous settings
  status: text("status").notNull().default("applied"), // applied, failed, reverted
  notes: text("notes"),
});

export const insertServerMoodSchema = createInsertSchema(serverMoods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServerMoodApplicationSchema = createInsertSchema(serverMoodApplications).omit({
  id: true,
  appliedAt: true,
});

export type ServerMood = typeof serverMoods.$inferSelect;
export type InsertServerMood = z.infer<typeof insertServerMoodSchema>;
export type ServerMoodApplication = typeof serverMoodApplications.$inferSelect;
export type InsertServerMoodApplication = z.infer<typeof insertServerMoodApplicationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
});
