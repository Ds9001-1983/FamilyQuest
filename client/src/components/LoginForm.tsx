import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
});

const registerSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  familyName: z.string().min(2, "Familienname muss mindestens 2 Zeichen haben"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState("login");
  const { loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      familyName: "",
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: onLoginSuccess,
    });
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: onLoginSuccess,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
              <Rocket className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              LevelMission
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Verwandeln Sie Hausarbeiten in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                Abenteuer
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
              Ein Familien-Aufgabensystem, das Lernen und Organisation spielerisch macht. 
              Sammeln Sie XP, verdienen Sie Belohnungen und machen Sie alltägliche Aufgaben zu einem Spiel!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">XP</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Punkte sammeln</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">🎯</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Missionen</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">🏆</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Belohnungen</div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Willkommen bei LevelMission</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Melden Sie sich an oder erstellen Sie ein Familienkonto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Anmelden</TabsTrigger>
                  <TabsTrigger value="register">Registrieren</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300">E-Mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="familie@beispiel.de"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300">Passwort</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Anmelden...
                        </>
                      ) : (
                        "Anmelden"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-6">
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-familyName" className="text-gray-700 dark:text-gray-300">Familienname</Label>
                      <Input
                        id="register-familyName"
                        placeholder="Familie Müller"
                        {...registerForm.register("familyName")}
                      />
                      {registerForm.formState.errors.familyName && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.familyName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-700 dark:text-gray-300">E-Mail</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="familie@beispiel.de"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-700 dark:text-gray-300">Passwort</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Registrieren...
                        </>
                      ) : (
                        "Familienkonto erstellen"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}