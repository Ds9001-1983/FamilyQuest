import { families, users, missions, rewards, type Family, type InsertFamily, type User, type InsertUser, type Mission, type InsertMission, type Reward, type InsertReward } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Families
  getFamilyByEmail(email: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  updateFamilySetupStatus(id: number, isComplete: boolean): Promise<Family | undefined>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByFamilyId(familyId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  createFamilyChild(name: string, age: number, familyId: number): Promise<User>;
  updateUserXP(id: number, xp: number): Promise<User | undefined>;
  
  // Missions
  getMissionsByUserId(userId: number): Promise<Mission[]>;
  getAllMissions(): Promise<Mission[]>;
  getCompletedMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  completeMission(id: number): Promise<Mission | undefined>;
  undoMission(id: number): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<boolean>;
  
  // Rewards
  getRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  deleteReward(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Family methods
  async getFamilyByEmail(email: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.email, email));
    return family || undefined;
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const [family] = await db
      .insert(families)
      .values(insertFamily)
      .returning();
    return family;
  }

  async updateFamilySetupStatus(id: number, isComplete: boolean): Promise<Family | undefined> {
    const [family] = await db
      .update(families)
      .set({ isSetupComplete: isComplete })
      .where(eq(families.id, id))
      .returning();
    return family || undefined;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsersByFamilyId(familyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.familyId, familyId));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createFamilyChild(name: string, age: number, familyId: number): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: `${name.toLowerCase()}_${Date.now()}`, // Unique username
        password: 'child_account', // Dummy password for children
        isParent: false,
        totalXP: 0,
        name,
        age,
        familyId,
      })
      .returning();
    return user;
  }

  async updateUserXP(id: number, xp: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ totalXP: xp })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getMissionsByUserId(userId: number): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(and(
        eq(missions.assignedToUserId, userId),
        eq(missions.completed, false)
      ));
  }

  async getAllMissions(): Promise<Mission[]> {
    return await db.select().from(missions).where(eq(missions.completed, false));
  }

  async getCompletedMissions(): Promise<Mission[]> {
    return await db.select().from(missions).where(eq(missions.completed, true));
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values(insertMission)
      .returning();
    return mission;
  }

  async completeMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db
      .update(missions)
      .set({ 
        completed: true, 
        completedAt: new Date() 
      })
      .where(eq(missions.id, id))
      .returning();

    if (mission && mission.assignedToUserId) {
      // Award XP to the assigned user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, mission.assignedToUserId));
      
      if (user) {
        await db
          .update(users)
          .set({ totalXP: user.totalXP + mission.xpReward })
          .where(eq(users.id, user.id));
      }
    }

    return mission || undefined;
  }

  async undoMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db
      .update(missions)
      .set({ completed: false, completedAt: null })
      .where(eq(missions.id, id))
      .returning();

    if (mission && mission.assignedToUserId) {
      // Remove XP from the assigned user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, mission.assignedToUserId));

      if (user) {
        const newXP = Math.max(0, user.totalXP - mission.xpReward);
        await db
          .update(users)
          .set({ totalXP: newXP })
          .where(eq(users.id, mission.assignedToUserId));
      }
    }

    return mission || undefined;
  }

  async deleteMission(id: number): Promise<boolean> {
    const result = await db
      .delete(missions)
      .where(eq(missions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const [reward] = await db
      .insert(rewards)
      .values(insertReward)
      .returning();
    return reward;
  }

  async deleteReward(id: number): Promise<boolean> {
    const result = await db
      .delete(rewards)
      .where(eq(rewards.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
