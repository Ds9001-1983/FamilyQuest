import { families, users, missions, rewards, type Family, type InsertFamily, type User, type InsertUser, type Mission, type InsertMission, type Reward, type InsertReward, type MissionStatus } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Families
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyByEmail(email: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  updateFamilySetupStatus(id: number, isComplete: boolean): Promise<Family | undefined>;
  updateFamilyPin(id: number, pin: string): Promise<Family | undefined>;
  
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
  getActiveMissions(): Promise<Mission[]>;
  getPendingApprovalMissions(): Promise<Mission[]>;
  getApprovedMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  submitMission(id: number): Promise<Mission | undefined>;
  approveMission(id: number): Promise<Mission | undefined>;
  rejectMission(id: number): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<boolean>;
  
  // Rewards
  getRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  deleteReward(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Family methods
  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }

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

  async updateFamilyPin(id: number, pin: string): Promise<Family | undefined> {
    const [family] = await db
      .update(families)
      .set({ parentPin: pin })
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
        eq(missions.status, "pending")
      ));
  }

  async getAllMissions(): Promise<Mission[]> {
    return await db.select().from(missions);
  }

  async getActiveMissions(): Promise<Mission[]> {
    // Get missions that are pending or pending_approval (not yet approved/rejected)
    const allMissions = await db.select().from(missions);
    return allMissions.filter(m => m.status === "pending" || m.status === "pending_approval");
  }

  async getPendingApprovalMissions(): Promise<Mission[]> {
    return await db.select().from(missions).where(eq(missions.status, "pending_approval"));
  }

  async getApprovedMissions(): Promise<Mission[]> {
    return await db.select().from(missions).where(eq(missions.status, "approved"));
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values(insertMission)
      .returning();
    return mission;
  }

  // Child submits mission for approval
  async submitMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db
      .update(missions)
      .set({
        status: "pending_approval",
        submittedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();
    return mission || undefined;
  }

  // Parent approves mission - awards XP
  async approveMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db
      .update(missions)
      .set({
        status: "approved",
        completedAt: new Date(),
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

  // Parent rejects mission - back to pending
  async rejectMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db
      .update(missions)
      .set({
        status: "pending",
        submittedAt: null,
      })
      .where(eq(missions.id, id))
      .returning();
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
