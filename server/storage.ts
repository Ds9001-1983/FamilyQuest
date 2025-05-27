import { users, missions, rewards, type User, type InsertUser, type Mission, type InsertMission, type Reward, type InsertReward } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserXP(id: number, xp: number): Promise<User | undefined>;
  
  // Missions
  getMissionsByUserId(userId: number): Promise<Mission[]>;
  getAllMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  completeMission(id: number): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<boolean>;
  
  // Rewards
  getRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  deleteReward(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private missions: Map<number, Mission>;
  private rewards: Map<number, Reward>;
  private currentUserId: number;
  private currentMissionId: number;
  private currentRewardId: number;

  constructor() {
    this.users = new Map();
    this.missions = new Map();
    this.rewards = new Map();
    this.currentUserId = 1;
    this.currentMissionId = 1;
    this.currentRewardId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample parent and child users
    const parent: User = {
      id: this.currentUserId++,
      username: "parent",
      password: "password",
      isParent: true,
      totalXP: 0,
    };
    this.users.set(parent.id, parent);

    const child: User = {
      id: this.currentUserId++,
      username: "child",
      password: "password",
      isParent: false,
      totalXP: 85,
    };
    this.users.set(child.id, child);

    // Create sample missions
    const sampleMissions: Mission[] = [
      {
        id: this.currentMissionId++,
        title: "Zimmer aufräumen",
        description: "Das Kinderzimmer sauber machen",
        xpReward: 10,
        assignedToUserId: child.id,
        createdByUserId: parent.id,
        completed: false,
        completedAt: null,
        icon: "home",
      },
      {
        id: this.currentMissionId++,
        title: "Hausaufgaben machen",
        description: "Alle Hausaufgaben erledigen",
        xpReward: 10,
        assignedToUserId: child.id,
        createdByUserId: parent.id,
        completed: false,
        completedAt: null,
        icon: "book",
      },
      {
        id: this.currentMissionId++,
        title: "Hund füttern",
        description: "Den Hund morgens und abends füttern",
        xpReward: 10,
        assignedToUserId: child.id,
        createdByUserId: parent.id,
        completed: false,
        completedAt: null,
        icon: "paw",
      },
    ];

    sampleMissions.forEach(mission => this.missions.set(mission.id, mission));

    // Create sample rewards
    const sampleRewards: Reward[] = [
      {
        id: this.currentRewardId++,
        name: "Kinoabend",
        description: "Ein Abend im Kino mit der Familie",
        requiredXP: 150,
        icon: "film",
        createdByUserId: parent.id,
      },
      {
        id: this.currentRewardId++,
        name: "Videospiel-Zeit",
        description: "Extra Zeit für Videospiele",
        requiredXP: 250,
        icon: "gamepad2",
        createdByUserId: parent.id,
      },
      {
        id: this.currentRewardId++,
        name: "Eis essen gehen",
        description: "Ausflug zur Eisdiele",
        requiredXP: 350,
        icon: "ice-cream",
        createdByUserId: parent.id,
      },
    ];

    sampleRewards.forEach(reward => this.rewards.set(reward.id, reward));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, totalXP: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUserXP(id: number, xp: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.totalXP = xp;
      this.users.set(id, user);
      return user;
    }
    return undefined;
  }

  async getMissionsByUserId(userId: number): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(
      mission => mission.assignedToUserId === userId && !mission.completed
    );
  }

  async getAllMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values());
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const id = this.currentMissionId++;
    const mission: Mission = {
      ...insertMission,
      id,
      completed: false,
      completedAt: null,
    };
    this.missions.set(id, mission);
    return mission;
  }

  async completeMission(id: number): Promise<Mission | undefined> {
    const mission = this.missions.get(id);
    if (mission && !mission.completed) {
      mission.completed = true;
      mission.completedAt = new Date();
      this.missions.set(id, mission);
      
      // Award XP to the assigned user
      if (mission.assignedToUserId) {
        const user = this.users.get(mission.assignedToUserId);
        if (user) {
          user.totalXP += mission.xpReward;
          this.users.set(user.id, user);
        }
      }
      
      return mission;
    }
    return undefined;
  }

  async deleteMission(id: number): Promise<boolean> {
    return this.missions.delete(id);
  }

  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = this.currentRewardId++;
    const reward: Reward = { ...insertReward, id };
    this.rewards.set(id, reward);
    return reward;
  }

  async deleteReward(id: number): Promise<boolean> {
    return this.rewards.delete(id);
  }
}

export const storage = new MemStorage();
