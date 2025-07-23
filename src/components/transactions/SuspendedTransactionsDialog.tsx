"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ShoppingCart, 
  Trash2, 
  Play, 
  User, 
  Store,
  Calendar,
  DollarSign,
  Package
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SuspendedTransactionService } from "@/lib/suspended-transaction-service";
import { MoneyDisplay } from "@/components/currency";
import { useI18n } from "@/contexts/translation-context";
import { toast } from "sonner";
import type { SuspendedTransaction } from "@/types/transactions";

interface SuspendedTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResumeTransaction: (transactionId: number) => void;
  currentStoreId?: number;
}

export function SuspendedTransactionsDialog({
  open,
  onOpenChange,
  onResumeTransaction,
  currentStoreId
}: SuspendedTransactionsDialogProps) {
  const { t } = useI18n();
  const [suspendedTransactions, setSuspendedTransactions] = useState<SuspendedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadSuspendedTransactions = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { suspendedTransactions: transactions } = await SuspendedTransactionService.getSuspendedTransactions({
        storeId: currentStoreId,
        limit: 50 // Show up to 50 suspended transactions
      });
      setSuspendedTransactions(transactions);
    } catch (error) {
      console.error("Error loading suspended transactions:", error);
      toast.error("Failed to load suspended transactions");
    } finally {
      setIsLoading(false);
    }
  }, [currentStoreId]);

  const handleDeleteTransaction = async (transactionId: number): Promise<void> => {
    if (!confirm("Are you sure you want to delete this suspended transaction? This action cannot be undone.")) {
      return;
    }

    setDeletingId(transactionId);
    try {
      await SuspendedTransactionService.deleteSuspendedTransaction(transactionId);
      toast.success("Suspended transaction deleted");
      loadSuspendedTransactions(); // Reload list
    } catch (error) {
      console.error("Error deleting suspended transaction:", error);
      toast.error("Failed to delete suspended transaction");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResumeTransaction = (transactionId: number): void => {
    onResumeTransaction(transactionId);
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      loadSuspendedTransactions();
    }
  }, [open, loadSuspendedTransactions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Suspended Transactions
          </DialogTitle>
          <DialogDescription>
            Resume or manage previously suspended transactions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading suspended transactions...</div>
            </div>
          ) : suspendedTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <ShoppingCart className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Suspended Transactions</h3>
                <p className="text-muted-foreground">
                  {currentStoreId 
                    ? "No suspended transactions found for this store."
                    : "No suspended transactions found."
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {suspendedTransactions.map((transaction) => (
                <Card key={transaction.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {transaction.sessionName || transaction.number}
                          <Badge variant="secondary" className="text-xs">
                            Suspended
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Invoice: {transaction.number}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleResumeTransaction(transaction.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="size-4" />
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          disabled={deletingId === transaction.id}
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          {deletingId === transaction.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Store className="size-4 text-muted-foreground" />
                        <span>{transaction.store.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span>{transaction.user.fullName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-muted-foreground" />
                        <span>{transaction.itemCount} items</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <MoneyDisplay amount={transaction.total} currencyId={1} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>
                        Suspended {formatDistanceToNow(new Date(transaction.suspendedAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {transaction.notes && (
                      <div className="mt-3 p-2 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {transaction.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
