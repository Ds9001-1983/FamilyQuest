import { families, users, missions, rewards, type Family, type InsertFamily, type User, type InsertUser, type Mission, type InsertMission, type Reward, type InsertReward } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Families
  getFamilyById(id: number): Promise<Family | undefined>;
  getFamilyByEmail(email: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  createFamilyWithParent(
    family: InsertFamily,
    parent: { name: string },
  ): Promise<{ family: Family; parent: User }>;
  updateFamilySetupStatus(id: number, isComplete: boolean): Promise<Family | undefined>;
  deleteFamily(id: number): Promise<boolean>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByFamilyId(familyId: number): Promise<User[]>;
  getParentOfFamily(familyId: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createFamilyChild(name: string, age: number, familyId: number): Promise<User>;
  updateUserXP(id: number, xp: number): Promise<User | undefined>;
  setChildPinHash(familyId: number, userId: number, pinHash: string | null): Promise<User | undefined>;
  setUserPushToken(userId: number, token: string | null): Promise<User | undefined>;
  
  // Missions — all queries are scoped to a family.
  getMissionsByUserId(familyId: number, userId: number): Promise<Mission[]>;
  getAllMissions(familyId: number): Promise<Mission[]>;
  getCompletedMissions(familyId: number): Promise<Mission[]>;
  createMission(mission: InsertMission & { familyId: number; createdByUserId: number }): Promise<Mission>;
  completeMission(familyId: number, id: number): Promise<Mission | undefined>;
  undoMission(familyId: number, id: number): Promise<Mission | undefined>;
  deleteMission(familyId: number, id: number): Promise<boolean>;

  // Rewards — scoped to a family.
  getRewards(familyId: number): Promise<Reward[]>;
  createReward(reward: InsertReward & { familyId: number; createdByUserId: number }): Promise<Reward>;
  deleteReward(familyId: number, id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Family methods
  async getFamilyById(id: number): Promise<Family | undefined> {
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

  async createFamilyWithParent(
    insertFamily: InsertFamily,
    parent: { name: string },
  ): Promise<{ family: Family; parent: User }> {
    return await db.transaction(async (tx) => {
      const [family] = await tx
        .insert(families)
        .values(insertFamily)
        .returning();

      const [parentUser] = await tx
        .insert(users)
        .values({
          username: insertFamily.email,
          password: insertFamily.password,
          isParent: true,
          totalXP: 0,
          name: parent.name,
          familyId: family.id,
        })
        .returning();

      return { family, parent: parentUser };
    });
  }

  async updateFamilySetupStatus(id: number, isComplete: boolean): Promise<Family | undefined> {
    const [family] = await db
      .update(families)
      .set({ isSetupComplete: isComplete })
      .where(eq(families.id, id))
      .returning();
    return family || undefined;
  }

  async deleteFamily(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const familyUsers = await tx.select({ id: users.id }).from(users).where(eq(users.familyId, id));
      const userIds = familyUsers.map((u) => u.id);

      if (userIds.length > 0) {
        await tx.delete(missions).where(inArray(missions.assignedToUserId, userIds));
        await tx.delete(missions).where(inArray(missions.createdByUserId, userIds));
        await tx.delete(rewards).where(inArray(rewards.createdByUserId, userIds));
      }

      await tx.delete(users).where(eq(users.familyId, id));
      const result = await tx.delete(families).where(eq(families.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    });
  }

  async getParentOfFamily(familyId: number): Promise<User | undefined> {
    const [parent] = await db
      .select()
      .from(users)
      .where(and(eq(users.familyId, familyId), eq(users.isParent, true)));
    return parent || undefined;
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
    // Children do not log in via username/password today. We still need to fill the
    // NOT NULL `password` column; use a cryptographically random placeholder that
    // cannot be guessed so the account is unusable without an explicit child-login
    // mechanism (PIN-based flow to be added later).
    const unusablePassword = `!${randomBytes(32).toString("hex")}`;
    const [user] = await db
      .insert(users)
      .values({
        username: `child_${familyId}_${randomBytes(8).toString("hex")}`,
        password: unusablePassword,
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

  async setChildPinHash(familyId: number, userId: number, pinHash: string | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ pinHash })
      .where(and(eq(users.id, userId), eq(users.familyId, familyId), eq(users.isParent, false)))
      .returning();
    return user || undefined;
  }

  async setUserPushToken(userId: number, token: string | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ pushToken: token })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getMissionsByUserId(familyId: number, userId: number): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(and(
        eq(missions.familyId, familyId),
        eq(missions.assignedToUserId, userId),
        eq(missions.completed, false),
      ));
  }

  async getAllMissions(familyId: number): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(and(eq(missions.familyId, familyId), eq(missions.completed, false)));
  }

  async getCompletedMissions(familyId: number): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(and(eq(missions.familyId, familyId), eq(missions.completed, true)));
  }

  async createMission(
    insertMission: InsertMission & { familyId: number; createdByUserId: number },
  ): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values(insertMission)
      .returning();
    return mission;
  }

  async completeMission(familyId: number, id: number): Promise<Mission | undefined> {
    return await db.transaction(async (tx) => {
      const [mission] = await tx
        .update(missions)
        .set({ completed: true, completedAt: new Date() })
        .where(and(eq(missions.id, id), eq(missions.familyId, familyId)))
        .returning();

      if (mission?.assignedToUserId) {
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, mission.assignedToUserId));
        if (user) {
          await tx
            .update(users)
            .set({ totalXP: user.totalXP + mission.xpReward })
            .where(eq(users.id, user.id));
        }
      }

      return mission || undefined;
    });
  }

  async undoMission(familyId: number, id: number): Promise<Mission | undefined> {
    return await db.transaction(async (tx) => {
      const [mission] = await tx
        .update(missions)
        .set({ completed: false, completedAt: null })
        .where(and(eq(missions.id, id), eq(missions.familyId, familyId)))
        .returning();

      if (mission?.assignedToUserId) {
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, mission.assignedToUserId));
        if (user) {
          const newXP = Math.max(0, user.totalXP - mission.xpReward);
          await tx
            .update(users)
            .set({ totalXP: newXP })
            .where(eq(users.id, mission.assignedToUserId));
        }
      }

      return mission || undefined;
    });
  }

  async deleteMission(familyId: number, id: number): Promise<boolean> {
    const result = await db
      .delete(missions)
      .where(and(eq(missions.id, id), eq(missions.familyId, familyId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRewards(familyId: number): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.familyId, familyId));
  }

  async createReward(
    insertReward: InsertReward & { familyId: number; createdByUserId: number },
  ): Promise<Reward> {
    const [reward] = await db
      .insert(rewards)
      .values(insertReward)
      .returning();
    return reward;
  }

  async deleteReward(familyId: number, id: number): Promise<boolean> {
    const result = await db
      .delete(rewards)
      .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
