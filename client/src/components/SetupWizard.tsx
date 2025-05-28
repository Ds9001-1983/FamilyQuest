import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Users, Gift, Star, CheckCircle } from 'lucide-react';

const setupSchema = z.object({
  children: z.array(z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    age: z.number().min(1).max(18),
  })).min(1, 'Mindestens ein Kind muss hinzugefügt werden'),
  rewards: z.array(z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    description: z.string(),
    requiredXP: z.number().min(1, 'XP müssen mindestens 1 sein'),
  })).min(1, 'Mindestens eine Belohnung muss hinzugefügt werden'),
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
      children: [{ name: '', age: 8 }],
      rewards: [
        { name: 'Kinoabend', description: 'Ein Filmabend mit der ganzen Familie', requiredXP: 50 },
        { name: 'Lieblingsdessert', description: 'Das Lieblingsdessert zum Abendessen', requiredXP: 30 },
        { name: 'Extra Spielzeit', description: '30 Minuten extra Bildschirmzeit', requiredXP: 20 },
      ],
    },
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: 'children',
  });

  const { fields: rewardsFields, append: appendReward, remove: removeReward } = useFieldArray({
    control: form.control,
    name: 'rewards',
  });

  const setupMutation = useMutation({
    mutationFn: async (data: SetupForm) => {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Setup fehlgeschlagen');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setup erfolgreich abgeschlossen!",
        description: "Ihre Familie ist jetzt bereit für LevelMission!",
      });
      queryClient.invalidateQueries();
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
      form.trigger('children').then((isValid) => {
        if (isValid) setCurrentStep(2);
      });
    } else if (currentStep === 2) {
      form.trigger('rewards').then((isValid) => {
        if (isValid) setCurrentStep(3);
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const steps = [
    { number: 1, title: 'Kinder hinzufügen', icon: Users },
    { number: 2, title: 'Belohnungen festlegen', icon: Gift },
    { number: 3, title: 'Zusammenfassung', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mission-green/10 to-mission-blue/10 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isCompleted ? 'bg-mission-green text-white' :
                    isActive ? 'bg-mission-blue text-white' :
                    'bg-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      isCompleted ? 'bg-mission-green' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.number} className="text-xs text-center w-10">
                {step.title}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-mission-text">
              Willkommen bei LevelMission, {user.familyName}!
            </CardTitle>
            <CardDescription>
              Lassen Sie uns Ihr Familien-Belohnungssystem einrichten
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {/* Step 1: Children */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-mission-blue mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Ihre Kinder</h3>
                      <p className="text-gray-600">Fügen Sie Ihre Kinder hinzu, für die Sie Aufgaben erstellen möchten</p>
                    </div>

                    <div className="space-y-4">
                      {childrenFields.map((field, index) => (
                        <div key={field.id} className="flex items-end space-x-4 p-4 bg-gray-50 rounded-lg">
                          <FormField
                            control={form.control}
                            name={`children.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="z.B. Anna" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`children.${index}.age`}
                            render={({ field }) => (
                              <FormItem className="w-20">
                                <FormLabel>Alter</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="18"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {childrenFields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeChild(index)}
                              className="mb-6"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendChild({ name: '', age: 8 })}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Weiteres Kind hinzufügen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Rewards */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Gift className="h-12 w-12 text-mission-yellow mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Belohnungen festlegen</h3>
                      <p className="text-gray-600">Erstellen Sie Belohnungen, die Ihre Kinder motivieren</p>
                    </div>

                    <div className="space-y-4">
                      {rewardsFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-4">
                            <div className="flex-1 space-y-4">
                              <FormField
                                control={form.control}
                                name={`rewards.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Belohnungsname</FormLabel>
                                    <FormControl>
                                      <Input placeholder="z.B. Kinoabend" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`rewards.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Beschreibung</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Beschreiben Sie die Belohnung..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`rewards.${index}.requiredXP`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Benötigte XP</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="1"
                                        placeholder="z.B. 50"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {rewardsFields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeReward(index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendReward({ name: '', description: '', requiredXP: 20 })}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Weitere Belohnung hinzufügen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Summary */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-mission-green mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Zusammenfassung</h3>
                      <p className="text-gray-600">Überprüfen Sie Ihre Einstellungen vor dem Abschluss</p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-mission-blue mb-3">Ihre Kinder:</h4>
                        <div className="space-y-2">
                          {form.watch('children').map((child, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{child.name}</span>
                              <span className="text-gray-500">{child.age} Jahre</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-mission-green mb-3">Belohnungen:</h4>
                        <div className="space-y-3">
                          {form.watch('rewards').map((reward, index) => (
                            <div key={index} className="border-l-4 border-mission-green pl-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{reward.name}</p>
                                  <p className="text-sm text-gray-600">{reward.description}</p>
                                </div>
                                <span className="bg-mission-green text-white px-2 py-1 rounded text-sm">
                                  {reward.requiredXP} XP
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Zurück
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-mission-green to-mission-blue"
                    >
                      Weiter
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-mission-green to-mission-blue"
                      disabled={setupMutation.isPending}
                    >
                      {setupMutation.isPending ? 'Setup wird abgeschlossen...' : 'Setup abschließen'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}