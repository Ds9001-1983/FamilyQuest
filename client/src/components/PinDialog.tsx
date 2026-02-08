import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PinDialog({ open, onOpenChange, onSuccess }: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-pin", { pin });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "PIN ungültig");
      }
      return response.json();
    },
    onSuccess: () => {
      setPin("");
      setError("");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setPin("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("PIN muss 4 Ziffern haben");
      return;
    }
    verifyMutation.mutate(pin);
  };

  const handlePinChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Eltern-PIN eingeben
          </DialogTitle>
          <DialogDescription>
            Geben Sie Ihren 4-stelligen PIN ein, um auf den Elternbereich zuzugreifen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="****"
              className="text-center text-3xl tracking-[0.5em] font-mono"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPin("");
                setError("");
                onOpenChange(false);
              }}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={pin.length !== 4 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Bestätigen"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
