import { db } from "./db";
import { platforms, accounts, content, schedules } from "@shared/schema";

export async function initializeDatabase() {
  try {
    // Check if platforms exist, if not create default ones
    const existingPlatforms = await db.select().from(platforms);
    
    if (existingPlatforms.length === 0) {
      await db.insert(platforms).values([
        {
          name: "youtube",
          displayName: "YouTube",
          icon: "🎥",
          color: "bg-red-500",
          isActive: true,
        },
        {
          name: "instagram",
          displayName: "Instagram",
          icon: "📷",
          color: "bg-pink-500",
          isActive: true,
        },
        {
          name: "twitter",
          displayName: "Twitter",
          icon: "🐦",
          color: "bg-blue-500",
          isActive: true,
        },
        {
          name: "linkedin",
          displayName: "LinkedIn",
          icon: "💼",
          color: "bg-blue-600",
          isActive: true,
        },
      ]);

      // Add sample accounts
      await db.insert(accounts).values([
        {
          platformId: 1,
          name: "Tech Channel",
          username: "@techchannel",
          isActive: true,
          metadata: { subscribers: 15000 },
        },
        {
          platformId: 1,
          name: "Gaming Content",
          username: "@gamingcontent",
          isActive: true,
          metadata: { subscribers: 8500 },
        },
        {
          platformId: 2,
          name: "Travel Stories",
          username: "@travelstories",
          isActive: true,
          metadata: { followers: 12000 },
        },
        {
          platformId: 3,
          name: "Business Updates",
          username: "@businessupdates",
          isActive: true,
          metadata: { followers: 5000 },
        },
      ]);

      // Add sample content
      await db.insert(content).values([
        {
          title: "Travel Video Story",
          description: "Amazing journey through the mountains",
          type: "video",
          status: "pending",
          sourceText: "Create a video about mountain adventure",
          generationPrompt: "Mountain adventure with scenic views",
          platformId: 1,
          accountId: 1,
          metadata: { duration: 120 },
        },
        {
          title: "Tech Review Image",
          description: "Latest smartphone review",
          type: "image",
          status: "approved",
          generationPrompt: "Modern smartphone with sleek design",
          platformId: 2,
          accountId: 3,
          metadata: { resolution: "1080x1080" },
        },
        {
          title: "Business Infographic",
          description: "Q4 performance metrics",
          type: "image",
          status: "draft",
          generationPrompt: "Professional business charts and graphs",
          platformId: 4,
          accountId: 4,
          metadata: { format: "infographic" },
        },
      ]);

      console.log("Database initialized with default data");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}