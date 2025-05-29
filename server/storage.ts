import {
  users,
  platforms,
  accounts,
  content,
  schedules,
  apiKeys,
  type User,
  type InsertUser,
  type Platform,
  type InsertPlatform,
  type Account,
  type InsertAccount,
  type Content,
  type InsertContent,
  type Schedule,
  type InsertSchedule,
  type ApiKey,
  type InsertApiKey
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Platform methods
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform | undefined>;

  // Account methods
  getAccounts(): Promise<Account[]>;
  getAccountsByPlatform(platformId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Content methods
  getContent(): Promise<Content[]>;
  getContentByStatus(status: string): Promise<Content[]>;
  getContentById(id: number): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;

  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedulesByAccount(accountId: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;

  // API Key methods
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByService(service: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;

  // Stats
  getStats(): Promise<{
    connectedAccounts: number;
    pendingApprovals: number;
    postsThisMonth: number;
    generatedMedia: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform || undefined;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(platforms).values(platform).returning();
    return newPlatform;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const [updated] = await db.update(platforms)
      .set(platform)
      .where(eq(platforms.id, id))
      .returning();
    return updated || undefined;
  }

  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccountsByPlatform(platformId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.platformId, platformId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await db.update(accounts)
      .set(account)
      .where(eq(accounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return true;
  }

  async getContent(): Promise<Content[]> {
    return await db.select().from(content);
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.status, status));
  }

  async getContentById(id: number): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item || undefined;
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(content).values(contentData).returning();
    return newContent;
  }

  async updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content | undefined> {
    const [updated] = await db.update(content)
      .set(contentData)
      .where(eq(content.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContent(id: number): Promise<boolean> {
    const result = await db.delete(content).where(eq(content.id, id));
    return true;
  }

  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async getSchedulesByAccount(accountId: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.accountId, accountId));
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values({
      ...schedule,
      publishedAt: null,
    }).returning();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [updated] = await db.update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return updated || undefined;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys);
  }

  async getApiKeyByService(service: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.service, service));
    return apiKey || undefined;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [updated] = await db.update(apiKeys)
      .set(apiKey)
      .where(eq(apiKeys.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return true;
  }

  async getStats(): Promise<{
    connectedAccounts: number;
    pendingApprovals: number;
    postsThisMonth: number;
    generatedMedia: number;
  }> {
    const allAccounts = await db.select().from(accounts);
    const pendingContent = await db.select().from(content).where(eq(content.status, "pending"));
    const allContent = await db.select().from(content);
    
    return {
      connectedAccounts: allAccounts.length,
      pendingApprovals: pendingContent.length,
      postsThisMonth: 12,
      generatedMedia: allContent.length,
    };
  }
}

export const storage = new DatabaseStorage();