import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Users, Gift, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const setupSchema = z.object({
  children: z.array(z.object({
    name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
    age: z.number().min(3).max(18),
  })).min(1, "Mindestens ein Kind muss hinzugefügt werden"),
  rewards: z.array(z.object({
    name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
    description: z.string().min(5, "Beschreibung muss mindestens 5 Zeichen haben"),
    xpCost: z.number().min(10).max(1000),
  })).min(1, "Mindestens eine Belohnung muss hinzugefügt werden"),
});

type SetupForm = z.infer<typeof setupSchema>;

interface SetupWizardProps {
  user: any;
  onSetupComplete: () => void;
}

export function SetupWizard({ user, onSetupComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      children: [{ name: "", age: 8 }],
      rewards: [
        { name: "Kinoabend", description: "Ein gemütlicher Filmabend mit der Familie", xpCost: 100 },
        { name: "Extra Taschengeld", description: "5€ zusätzliches Taschengeld", xpCost: 150 },
      ],
    },
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: "children",
  });

  const { fields: rewardsFields, append: appendReward, remove: removeReward } = useFieldArray({
    control: form.control,
    name: "rewards",
  });

  const setupMutation = useMutation({
    mutationFn: async (data: SetupForm) => {
      const response = await apiRequest("POST", "/api/family/setup", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Familie erfolgreich eingerichtet!",
        description: "Ihre Familie kann jetzt mit LevelMission loslegen!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onSetupComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Setup fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupForm) => {
    setupMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate children step
      form.trigger("children").then((isValid) => {
        if (isValid) setCurrentStep(2);
      });
    } else if (currentStep === 2) {
      // Validate rewards step
      form.trigger("rewards").then((isValid) => {
        if (isValid) setCurrentStep(3);
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Familie {user.familyName} einrichten
            </CardTitle>
            <CardDescription>
              Schritt {currentStep} von 3: Richten Sie Ihr Familienkonto ein
            </CardDescription>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Children */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Kinder hinzufügen</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Fügen Sie alle Kinder hinzu, die an LevelMission teilnehmen sollen.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {childrenFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`children.${index}.name`}>Name</Label>
                          <Input
                            id={`children.${index}.name`}
                            placeholder="Max"
                            {...form.register(`children.${index}.name`)}
                          />
                          {form.formState.errors.children?.[index]?.name && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.children[index]?.name?.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="w-24">
                          <Label htmlFor={`children.${index}.age`}>Alter</Label>
                          <Input
                            id={`children.${index}.age`}
                            type="number"
                            min="3"
                            max="18"
                            {...form.register(`children.${index}.age`, { valueAsNumber: true })}
                          />
                          {form.formState.errors.children?.[index]?.age && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.children[index]?.age?.message}
                            </p>
                          )}
                        </div>

                        {childrenFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeChild(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendChild({ name: "", age: 8 })}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Weiteres Kind hinzufügen
                  </Button>
                </div>
              )}

              {/* Step 2: Rewards */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Belohnungen definieren</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Erstellen Sie Belohnungen, die Ihre Kinder mit gesammelten XP-Punkten einlösen können.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {rewardsFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Belohnung {index + 1}</h4>
                          {rewardsFields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeReward(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`rewards.${index}.name`}>Name</Label>
                            <Input
                              id={`rewards.${index}.name`}
                              placeholder="Kinoabend"
                              {...form.register(`rewards.${index}.name`)}
                            />
                            {form.formState.errors.rewards?.[index]?.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {form.formState.errors.rewards[index]?.name?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor={`rewards.${index}.xpCost`}>XP-Kosten</Label>
                            <Input
                              id={`rewards.${index}.xpCost`}
                              type="number"
                              min="10"
                              max="1000"
                              placeholder="100"
                              {...form.register(`rewards.${index}.xpCost`, { valueAsNumber: true })}
                            />
                            {form.formState.errors.rewards?.[index]?.xpCost && (
                              <p className="text-sm text-red-600 mt-1">
                                {form.formState.errors.rewards[index]?.xpCost?.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`rewards.${index}.description`}>Beschreibung</Label>
                          <Textarea
                            id={`rewards.${index}.description`}
                            placeholder="Ein gemütlicher Filmabend mit der Familie"
                            {...form.register(`rewards.${index}.description`)}
                          />
                          {form.formState.errors.rewards?.[index]?.description && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.rewards[index]?.description?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendReward({ name: "", description: "", xpCost: 100 })}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Weitere Belohnung hinzufügen
                  </Button>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Überprüfung</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Überprüfen Sie Ihre Einstellungen bevor Sie das Setup abschließen.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Kinder ({form.watch("children").length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {form.watch("children").map((child, index) => (
                          <Badge key={index} variant="secondary">
                            {child.name} ({child.age} Jahre)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Belohnungen ({form.watch("rewards").length})</h4>
                      <div className="space-y-2">
                        {form.watch("rewards").map((reward, index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{reward.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {reward.description}
                                </div>
                              </div>
                              <Badge variant="outline">{reward.xpCost} XP</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6 mt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>

                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Weiter
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={setupMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {setupMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Setup wird abgeschlossen...
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Setup abschließen
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}