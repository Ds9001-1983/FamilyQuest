import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXP(xp: number): string {
  return `${xp} XP`;
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 100;
  return Math.min((current / target) * 100, 100);
}

export function getNextReward(rewards: any[], currentXP: number) {
  const availableRewards = rewards
    .filter(reward => reward.requiredXP > currentXP)
    .sort((a, b) => a.requiredXP - b.requiredXP);
  
  return availableRewards[0];
}

export function getIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    'home': 'fas fa-home',
    'book': 'fas fa-book',
    'paw': 'fas fa-paw',
    'tasks': 'fas fa-tasks',
    'gift': 'fas fa-gift',
    'film': 'fas fa-film',
    'gamepad2': 'fas fa-gamepad',
    'ice-cream': 'fas fa-ice-cream',
    'trophy': 'fas fa-trophy',
    'star': 'fas fa-star',
    'check': 'fas fa-check',
    'plus': 'fas fa-plus',
    'microphone': 'fas fa-microphone',
    'users': 'fas fa-users',
    'chart-bar': 'fas fa-chart-bar',
    'chart-line': 'fas fa-chart-line',
    'user': 'fas fa-user',
    'rocket': 'fas fa-rocket',
  };
  
  return iconMap[iconName] || 'fas fa-circle';
}
