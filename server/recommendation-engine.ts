import OpenAI from "openai";
import { storage } from "./storage.js";
import type { 
  WorkflowRecommendation, 
  InsertWorkflowRecommendation,
  UserPreferences,
  UserInteraction,
  ComfyWorkflow,
  ComfyGeneration
} from "../shared/schema.js";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  
  static getInstance(): AIRecommendationEngine {
    if (!this.instance) {
      this.instance = new AIRecommendationEngine();
    }
    return this.instance;
  }

  // Analyze user behavior patterns and generate personalized recommendations
  async generatePersonalizedRecommendations(userId: number): Promise<WorkflowRecommendation[]> {
    try {
      // Gather user data
      const userPrefs = await storage.getUserPreferences(userId);
      const recentInteractions = await storage.getUserInteractions(userId, 50); // Last 50 interactions
      const recentGenerations = await storage.getUserGenerations(userId, 20); // Last 20 generations
      const availableWorkflows = await storage.getComfyWorkflows();

      // Use OpenAI to analyze patterns and generate recommendations
      const analysis = await this.analyzeUserPatterns(userPrefs, recentInteractions, recentGenerations);
      const recommendations = await this.generateWorkflowRecommendations(analysis, availableWorkflows);

      // Store recommendations in database
      const savedRecommendations = [];
      for (const rec of recommendations) {
        const recommendationData: InsertWorkflowRecommendation = {
          userId,
          workflowId: rec.workflowId,
          recommendationType: rec.type,
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          promptSuggestions: rec.promptSuggestions,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        const saved = await storage.createWorkflowRecommendation(recommendationData);
        savedRecommendations.push(saved);
      }

      return savedRecommendations;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  // Analyze user patterns using OpenAI
  private async analyzeUserPatterns(
    userPrefs: UserPreferences | null,
    interactions: UserInteraction[],
    generations: ComfyGeneration[]
  ): Promise<any> {
    const prompt = `
Analyze this user's AI image generation patterns and preferences:

User Preferences: ${JSON.stringify(userPrefs, null, 2)}

Recent Interactions (${interactions.length} items):
${interactions.map(i => `- ${i.actionType} on ${i.entityType} at ${i.timestamp}`).join('\n')}

Recent Generations (${generations.length} items):
${generations.map(g => `- Prompt: "${g.prompt}" | Workflow: ${g.workflowId} | Status: ${g.status}`).join('\n')}

Please analyze:
1. User's style preferences and patterns
2. Frequency and timing of usage
3. Favorite prompt types and themes
4. Skill level progression
5. Areas for improvement or exploration

Provide insights in JSON format with the following structure:
{
  "stylePreferences": ["list", "of", "detected", "styles"],
  "promptPatterns": ["common", "prompt", "themes"],
  "usageFrequency": "daily|weekly|occasional",
  "skillLevel": "beginner|intermediate|advanced",
  "interests": ["detected", "interest", "categories"],
  "recommendations": {
    "explore": ["new", "styles", "to", "try"],
    "improve": ["areas", "for", "skill", "development"],
    "optimize": ["workflow", "efficiency", "tips"]
  }
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI expert specializing in ComfyUI workflow analysis and personalized recommendations. Analyze user patterns and provide insights to improve their creative workflow."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      return {
        stylePreferences: [],
        promptPatterns: [],
        usageFrequency: "occasional",
        skillLevel: "beginner",
        interests: [],
        recommendations: { explore: [], improve: [], optimize: [] }
      };
    }
  }

  // Generate specific workflow recommendations based on analysis
  private async generateWorkflowRecommendations(
    analysis: any,
    workflows: ComfyWorkflow[]
  ): Promise<any[]> {
    const prompt = `
Based on this user analysis, recommend the best ComfyUI workflows:

User Analysis: ${JSON.stringify(analysis, null, 2)}

Available Workflows:
${workflows.map(w => `- ID: ${w.id} | Name: "${w.name}" | Category: ${w.category} | Description: ${w.description}`).join('\n')}

Generate 3-5 personalized workflow recommendations. For each recommendation, provide:
1. Workflow ID from the available list
2. Recommendation type: "personal" (matches user style), "trending" (popular/new), or "skill_development" (helps user grow)
3. Confidence score (0-100)
4. Detailed reasoning why this workflow fits the user
5. 3-5 suggested prompts specifically tailored for this user and workflow

Respond in JSON format:
{
  "recommendations": [
    {
      "workflowId": 1,
      "type": "personal",
      "confidence": 85,
      "reasoning": "This workflow matches your interest in...",
      "promptSuggestions": ["specific prompt 1", "specific prompt 2", "specific prompt 3"]
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert ComfyUI workflow curator. Provide highly personalized workflow recommendations that match user preferences and help them grow their skills."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations || [];
    } catch (error) {
      console.error('Error generating workflow recommendations:', error);
      return [];
    }
  }

  // Track user interaction for learning
  async trackUserInteraction(userId: number, actionType: string, entityType: string, entityId: string, metadata: any = {}) {
    try {
      await storage.createUserInteraction({
        userId,
        actionType,
        entityType,
        entityId,
        metadata,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  // Update user preferences based on behavior
  async updateUserPreferences(userId: number, newData: Partial<UserPreferences>) {
    try {
      const existing = await storage.getUserPreferences(userId);
      if (existing) {
        await storage.updateUserPreferences(userId, newData);
      } else {
        await storage.createUserPreferences({
          userId,
          skillLevel: 'beginner',
          ...newData
        });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  // Get trending workflows based on recent usage
  async getTrendingWorkflows(limit: number = 5): Promise<WorkflowRecommendation[]> {
    try {
      // Analyze recent generations to find trending workflows
      const recentGenerations = await storage.getRecentGenerations(100);
      const workflowUsage = new Map<number, number>();
      
      recentGenerations.forEach(gen => {
        if (gen.workflowId) {
          workflowUsage.set(gen.workflowId, (workflowUsage.get(gen.workflowId) || 0) + 1);
        }
      });

      // Sort by usage and get top workflows
      const trending = Array.from(workflowUsage.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit);

      const recommendations = [];
      for (const [workflowId, usage] of trending) {
        const workflow = await storage.getComfyWorkflow(workflowId);
        if (workflow) {
          const confidence = Math.min(95, Math.max(60, (usage / recentGenerations.length) * 100 * 10));
          
          recommendations.push({
            id: 0,
            userId: 0, // Will be set when fetched for specific user
            workflowId,
            recommendationType: 'trending',
            confidence: Math.round(confidence),
            reasoning: `This workflow is trending with ${usage} recent uses. Popular for ${workflow.category} generation.`,
            promptSuggestions: await this.generateTrendingPrompts(workflow),
            isViewed: false,
            isUsed: false,
            userFeedback: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
          } as WorkflowRecommendation);
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting trending workflows:', error);
      return [];
    }
  }

  // Generate trending prompts for a workflow
  private async generateTrendingPrompts(workflow: ComfyWorkflow): Promise<string[]> {
    const prompt = `
Generate 3-5 trending, creative prompts for this ComfyUI workflow:

Workflow: "${workflow.name}"
Category: ${workflow.category}
Description: ${workflow.description}

Create prompts that:
1. Showcase the workflow's strengths
2. Are currently popular in AI art communities
3. Produce visually striking results
4. Appeal to a broad audience

Return only a JSON array of prompt strings:
["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative AI art prompt specialist. Generate engaging, trending prompts that produce amazing results."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{"prompts": []}');
      return result.prompts || [
        `beautiful ${workflow.category} artwork`,
        `stunning ${workflow.category} composition`,
        `creative ${workflow.category} design`
      ];
    } catch (error) {
      console.error('Error generating trending prompts:', error);
      return [
        `beautiful ${workflow.category} artwork`,
        `stunning ${workflow.category} composition`,
        `creative ${workflow.category} design`
      ];
    }
  }
}

export const recommendationEngine = AIRecommendationEngine.getInstance();