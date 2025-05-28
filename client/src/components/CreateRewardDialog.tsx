import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Gift, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createRewardSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  description: z.string().min(5, "Beschreibung muss mindestens 5 Zeichen haben"),
  requiredXP: z.number().min(10, "XP müssen mindestens 10 sein").max(1000, "Maximal 1000 XP"),
});

type CreateRewardForm = z.infer<typeof createRewardSchema>;

interface CreateRewardDialogProps {
  trigger?: React.ReactNode;
}

export function CreateRewardDialog({ trigger }: CreateRewardDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateRewardForm>({
    resolver: zodResolver(createRewardSchema),
    defaultValues: {
      name: "",
      description: "",
      requiredXP: 100,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRewardForm) => {
      const response = await apiRequest("POST", "/api/rewards", {
        name: data.name,
        description: data.description,
        requiredXP: data.requiredXP,
        createdByUserId: 1, // Parent user
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({
        title: "Belohnung erstellt!",
        description: "Die neue Belohnung wurde erfolgreich hinzugefügt.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Erstellen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateRewardForm) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Neue Belohnung
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Neue Belohnung erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Belohnung, die Kinder mit ihren XP einlösen können.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name der Belohnung</Label>
            <Input
              id="name"
              placeholder="z.B. Kinoabend, Extra Taschengeld..."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Beschreiben Sie die Belohnung im Detail..."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredXP">Benötigte XP-Punkte</Label>
            <Input
              id="requiredXP"
              type="number"
              min="10"
              max="1000"
              placeholder="100"
              {...form.register("requiredXP", { valueAsNumber: true })}
            />
            {form.formState.errors.requiredXP && (
              <p className="text-sm text-red-600">
                {form.formState.errors.requiredXP.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Erstellen...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Belohnung erstellen
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}