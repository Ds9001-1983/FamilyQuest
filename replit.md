# LevelMission - Project Documentation

## Overview
LevelMission is a gamified family task management web application designed to help families motivate children to complete everyday tasks. Features an XP system, mission lists, and reward system. Interface is in German.

## Recent Changes
- **2025-07-20**: Replaced all yellow elements with purple for better contrast
- **2025-07-20**: Changed primary green color to darker shade (#059669) for improved contrast
- **2025-07-20**: Fixed login page contrast issues - removed yellow background with white text
- **2025-07-20**: Implemented complete authentication system with family management
- **2025-07-20**: Added "Create Reward" dialog for parent mode

## User Preferences
- **Interface Language**: German
- **Color Scheme**: Green primary color (no yellow elements)
- **Contrast Requirements**: All text must have good contrast ratios
- **Design Philosophy**: Clean, professional interface suitable for families

## Project Architecture
- **Frontend**: React with TypeScript, Vite, TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with secure login system
- **State Management**: React Query for server state
- **UI Components**: shadcn/ui components

## Color Palette
- **Primary**: Green (#059669) - Used for main actions and success states
- **Secondary**: Blue (#3B82F6) - Used for secondary actions
- **Accent**: Purple (#9333ea) - Replaced yellow for better contrast
- **Background**: White/Gray for light mode, Dark gray for dark mode
- **Text**: Dark gray on light backgrounds, White on dark backgrounds

## Features
- User authentication with family setup wizard
- Mission management system with XP rewards
- Parent mode with administrative controls
- Reward system with customizable rewards
- Progress tracking and statistics
- Responsive design for all devices