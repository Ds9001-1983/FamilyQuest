import { useState } from 'react';
import { Plus, Home, Book, Heart, Star, Dumbbell, Palette, Dog, ShoppingBag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertMissionSchema } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const createMissionSchema = insertMissionSchema.extend({
  xpReward: z.number().min(1, 'XP muss mindestens 1 sein').max(100, 'XP kann maximal 100 sein'),
});

type CreateMissionForm = z.infer<typeof createMissionSchema>;

interface CreateMissionDialogProps {
  currentUserId: number;
  trigger?: React.ReactNode;
}

export function CreateMissionDialog({ currentUserId, trigger }: CreateMissionDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateMissionForm>({
    resolver: zodResolver(createMissionSchema),
    defaultValues: {
      title: '',
      description: '',
      xpReward: 10,
      assignedToUserId: 2, // Default to child user
      createdByUserId: currentUserId,
      icon: 'home',
    },
  });

  const createMissionMutation = useMutation({
    mutationFn: async (data: CreateMissionForm) => {
      const response = await apiRequest('POST', '/api/missions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mission erstellt! ✨",
        description: "Die neue Mission wurde erfolgreich hinzugefügt",
        className: "bg-mission-green text-white",
      });
      
      // Close dialog and reset form
      setOpen(false);
      form.reset();
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mission konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateMissionForm) => {
    createMissionMutation.mutate(data);
  };

  const iconOptions = [
    { value: 'home', icon: Home, label: 'Haushalt', color: 'text-blue-500' },
    { value: 'book', icon: Book, label: 'Lernen', color: 'text-purple-600' },
    { value: 'dog', icon: Dog, label: 'Haustier', color: 'text-amber-600' },
    { value: 'sport', icon: Dumbbell, label: 'Sport', color: 'text-green-600' },
    { value: 'creative', icon: Palette, label: 'Kreativ', color: 'text-orange-500' },
    { value: 'heart', icon: Heart, label: 'Helfen', color: 'text-pink-500' },
    { value: 'shopping', icon: ShoppingBag, label: 'Einkauf', color: 'text-teal-500' },
    { value: 'star', icon: Star, label: 'Sonstiges', color: 'text-yellow-500' },
  ];

  const defaultTrigger = (
    <Button className="bg-mission-green hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95">
      <Plus className="h-6 w-6" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-mission-text">
            Neue Mission erstellen
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mission-text font-medium">Titel</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="z.B. Zimmer aufräumen" 
                      {...field}
                      className="rounded-xl border-gray-300 focus:border-mission-green"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mission-text font-medium">Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beschreibe die Aufgabe genauer..."
                      {...field}
                      value={field.value || ''}
                      className="rounded-xl border-gray-300 focus:border-mission-green resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="xpReward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mission-text font-medium">XP Belohnung</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="rounded-xl border-gray-300 focus:border-mission-green"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mission-text font-medium">Symbol</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-4 gap-2">
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        const isSelected = field.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`p-3 rounded-xl border-2 transition-all min-h-[72px] ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <IconComponent className={`h-6 w-6 mx-auto ${
                              isSelected ? option.color : 'text-gray-400'
                            }`} />
                            <p className={`text-xs mt-1 ${isSelected ? 'text-purple-700 font-medium' : 'text-gray-500'}`}>
                              {option.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createMissionMutation.isPending}
                className="flex-1 bg-mission-green hover:bg-green-600 text-white rounded-xl"
              >
                {createMissionMutation.isPending ? 'Erstelle...' : 'Mission erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}