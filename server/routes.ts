import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, insertRewardSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (simplified for demo - in production would use session/auth)
  app.get("/api/user", async (req, res) => {
    try {
      // For demo purposes, return the child user
      const user = await storage.getUserByUsername("child");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get missions for current user
  app.get("/api/missions", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 2; // Default to child user
      const missions = await storage.getMissionsByUserId(userId);
      res.json(missions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get missions" });
    }
  });

  // Create a new mission
  app.post("/api/missions", async (req, res) => {
    try {
      const missionData = insertMissionSchema.parse(req.body);
      const mission = await storage.createMission(missionData);
      res.status(201).json(mission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mission" });
    }
  });

  // Complete a mission
  app.post("/api/missions/:id/complete", async (req, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const mission = await storage.completeMission(missionId);
      
      if (!mission) {
        return res.status(404).json({ message: "Mission not found or already completed" });
      }

      // Get updated user data
      const user = await storage.getUser(mission.assignedToUserId!);
      
      res.json({ mission, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete mission" });
    }
  });

  // Delete a mission
  app.delete("/api/missions/:id", async (req, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const deleted = await storage.deleteMission(missionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Mission not found" });
      }
      
      res.json({ message: "Mission deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mission" });
    }
  });

  // Get all rewards
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  // Create a new reward
  app.post("/api/rewards", async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  // Delete a reward
  app.delete("/api/rewards/:id", async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const deleted = await storage.deleteReward(rewardId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
