import { 
  Platform, InsertPlatform, 
  Account, InsertAccount,
  Content, InsertContent,
  Schedule, InsertSchedule,
  User, InsertUser
} from "@shared/schema";

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

  // Stats
  getStats(): Promise<{
    connectedAccounts: number;
    pendingApprovals: number;
    postsThisMonth: number;
    generatedMedia: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private platforms: Map<number, Platform>;
  private accounts: Map<number, Account>;
  private content: Map<number, Content>;
  private schedules: Map<number, Schedule>;
  private currentUserId: number;
  private currentPlatformId: number;
  private currentAccountId: number;
  private currentContentId: number;
  private currentScheduleId: number;

  constructor() {
    this.users = new Map();
    this.platforms = new Map();
    this.accounts = new Map();
    this.content = new Map();
    this.schedules = new Map();
    this.currentUserId = 1;
    this.currentPlatformId = 1;
    this.currentAccountId = 1;
    this.currentContentId = 1;
    this.currentScheduleId = 1;

    // Initialize with default platforms
    this.initializeDefaults();
  }

  private initializeDefaults() {
    const defaultPlatforms: InsertPlatform[] = [
      {
        name: "youtube",
        displayName: "YouTube",
        icon: "fab fa-youtube",
        color: "red",
        isActive: true,
      },
      {
        name: "instagram",
        displayName: "Instagram",
        icon: "fab fa-instagram",
        color: "pink",
        isActive: true,
      },
      {
        name: "twitter",
        displayName: "Twitter",
        icon: "fab fa-twitter",
        color: "blue",
        isActive: true,
      },
      {
        name: "linkedin",
        displayName: "LinkedIn",
        icon: "fab fa-linkedin",
        color: "indigo",
        isActive: true,
      },
    ];

    defaultPlatforms.forEach(platform => {
      const id = this.currentPlatformId++;
      this.platforms.set(id, { ...platform, id });
    });

    // Add some sample accounts
    const sampleAccounts: InsertAccount[] = [
      {
        platformId: 1, // YouTube
        name: "Tech Channel",
        username: "tech_channel",
        externalId: "UC123456789",
        metadata: { subscribers: "142K" },
        isActive: true,
      },
      {
        platformId: 1, // YouTube
        name: "Lifestyle Vlogs",
        username: "lifestyle_vlogs",
        externalId: "UC987654321",
        metadata: { subscribers: "89K" },
        isActive: true,
      },
      {
        platformId: 1, // YouTube
        name: "Gaming Channel",
        username: "gaming_channel",
        externalId: "UC456789123",
        metadata: { subscribers: "267K" },
        isActive: true,
      },
      {
        platformId: 2, // Instagram
        name: "Food Adventures",
        username: "food_adventures",
        externalId: "12345678",
        metadata: { followers: "45K" },
        isActive: true,
      },
      {
        platformId: 2, // Instagram
        name: "Travel Diary",
        username: "travel_diary",
        externalId: "87654321",
        metadata: { followers: "73K" },
        isActive: true,
      },
      {
        platformId: 3, // Twitter
        name: "Tech Updates",
        username: "tech_updates",
        externalId: "tech_updates",
        metadata: { followers: "12K" },
        isActive: true,
      },
      {
        platformId: 4, // LinkedIn
        name: "Professional Profile",
        username: "john_doe",
        externalId: "john-doe-123",
        metadata: { connections: "500+" },
        isActive: true,
      },
      {
        platformId: 4, // LinkedIn
        name: "Company Page",
        username: "my_company",
        externalId: "my-company-inc",
        metadata: { followers: "2.5K" },
        isActive: true,
      },
    ];

    sampleAccounts.forEach(account => {
      const id = this.currentAccountId++;
      this.accounts.set(id, { ...account, id, createdAt: new Date() });
    });

    // Add some sample content for approval workflow
    const sampleContent: InsertContent[] = [
      {
        title: "Travel Video Story",
        description: "Amazing travel adventure in Japan",
        type: "video",
        sourceText: "Just had the most amazing trip to Japan! The culture, food, and people were incredible.",
        status: "pending",
        platformId: 1,
        accountId: 1,
      },
      {
        title: "Food Recipe Post",
        description: "Delicious homemade pasta recipe",
        type: "image",
        generationPrompt: "A beautiful plate of homemade pasta with fresh basil and parmesan cheese",
        status: "pending",
        platformId: 2,
        accountId: 4,
      },
      {
        title: "Tech Tutorial",
        description: "How to use React hooks effectively",
        type: "video",
        sourceText: "React hooks have revolutionized how we write components. Let me show you the best practices.",
        status: "pending",
        platformId: 4,
        accountId: 7,
      },
    ];

    sampleContent.forEach(content => {
      const id = this.currentContentId++;
      this.content.set(id, { 
        ...content, 
        id, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Platform methods
  async getPlatforms(): Promise<Platform[]> {
    return Array.from(this.platforms.values());
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    return this.platforms.get(id);
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const id = this.currentPlatformId++;
    const newPlatform: Platform = { ...platform, id };
    this.platforms.set(id, newPlatform);
    return newPlatform;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const existing = this.platforms.get(id);
    if (!existing) return undefined;
    
    const updated: Platform = { ...existing, ...platform };
    this.platforms.set(id, updated);
    return updated;
  }

  // Account methods
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccountsByPlatform(platformId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.platformId === platformId);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const newAccount: Account = { ...account, id, createdAt: new Date() };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const existing = this.accounts.get(id);
    if (!existing) return undefined;
    
    const updated: Account = { ...existing, ...account };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Content methods
  async getContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(content => content.status === status);
  }

  async getContentById(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async createContent(content: InsertContent): Promise<Content> {
    const id = this.currentContentId++;
    const now = new Date();
    const newContent: Content = { 
      ...content, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.content.set(id, newContent);
    return newContent;
  }

  async updateContent(id: number, content: Partial<InsertContent>): Promise<Content | undefined> {
    const existing = this.content.get(id);
    if (!existing) return undefined;
    
    const updated: Content = { 
      ...existing, 
      ...content, 
      updatedAt: new Date() 
    };
    this.content.set(id, updated);
    return updated;
  }

  async deleteContent(id: number): Promise<boolean> {
    return this.content.delete(id);
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedulesByAccount(accountId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => schedule.accountId === accountId);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentScheduleId++;
    const newSchedule: Schedule = { 
      ...schedule, 
      id, 
      createdAt: new Date() 
    };
    this.schedules.set(id, newSchedule);
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const existing = this.schedules.get(id);
    if (!existing) return undefined;
    
    const updated: Schedule = { ...existing, ...schedule };
    this.schedules.set(id, updated);
    return updated;
  }

  // Stats
  async getStats(): Promise<{
    connectedAccounts: number;
    pendingApprovals: number;
    postsThisMonth: number;
    generatedMedia: number;
  }> {
    const activeAccounts = Array.from(this.accounts.values()).filter(account => account.isActive);
    const pendingContent = Array.from(this.content.values()).filter(content => content.status === "pending");
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const postsThisMonth = Array.from(this.content.values()).filter(content => {
      const contentDate = new Date(content.createdAt);
      return contentDate.getMonth() === currentMonth && contentDate.getFullYear() === currentYear;
    });
    const allContent = Array.from(this.content.values());

    return {
      connectedAccounts: activeAccounts.length,
      pendingApprovals: pendingContent.length,
      postsThisMonth: postsThisMonth.length,
      generatedMedia: allContent.length,
    };
  }
}

export const storage = new MemStorage();
