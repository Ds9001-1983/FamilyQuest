import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Rocket, Target, Gift, TrendingUp, User, Plus } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import { ModeToggle } from "@/components/ModeToggle";
import { CreateMissionDialog } from "@/components/CreateMissionDialog";
import NotFound from "@/pages/not-found";
import Missions from "@/pages/missions";
import Rewards from "@/pages/rewards";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";

function BottomNavigation() {
  const [location, navigate] = useLocation();
  
  const navItems = [
    { path: "/", icon: Target, label: "Missionen" },
    { path: "/rewards", icon: Gift, label: "Belohnungen" },
    { path: "/progress", icon: TrendingUp, label: "Fortschritt" },
    { path: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 transition-colors ${
                  isActive ? 'text-mission-green' : 'text-gray-500 hover:text-mission-blue'
                }`}
              >
                <IconComponent className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function FloatingActionButton() {
  const { mode, currentUserId } = useAppState();
  
  return (
    <div className="fixed bottom-20 right-6">
      <CreateMissionDialog currentUserId={currentUserId} />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* App Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-mission-green rounded-lg flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-mission-text">LevelMission</h1>
          </div>
          
          {/* Mode Toggle */}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-6 pb-20">
        <Switch>
          <Route path="/" component={Missions} />
          <Route path="/rewards" component={Rewards} />
          <Route path="/progress" component={Progress} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
      <FloatingActionButton />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-mission-bg">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
