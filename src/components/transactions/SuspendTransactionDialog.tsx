"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/translation-context";

interface SuspendTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuspend: (sessionName: string, notes?: string) => void;
  isLoading?: boolean;
}

export function SuspendTransactionDialog({
  open,
  onOpenChange,
  onSuspend,
  isLoading = false
}: SuspendTransactionDialogProps) {
  const { t } = useI18n();
  const [sessionName, setSessionName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSuspend = (): void => {
    if (!sessionName.trim()) return;
    
    onSuspend(sessionName.trim(), notes.trim() || undefined);
    
    // Reset form
    setSessionName("");
    setNotes("");
  };

  const handleCancel = (): void => {
    setSessionName("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Suspend Transaction</DialogTitle>
          <DialogDescription>
            Save this transaction to continue later. You can add or remove items when you resume.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sessionName">Session Name *</Label>
            <Input
              id="sessionName"
              placeholder="Enter a name to identify this transaction"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              maxLength={100}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this transaction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSuspend}
            disabled={!sessionName.trim() || isLoading}
          >
            {isLoading ? "Suspending..." : "Suspend Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
