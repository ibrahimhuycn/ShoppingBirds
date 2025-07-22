import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionCard } from "./TransactionCard";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { ChevronLeft, ChevronRight, Receipt, AlertCircle } from "lucide-react";
import { useI18n } from "@/contexts/translation-context";
import type { Transaction, TransactionSearchOptions } from "@/types/transactions";

interface TransactionListProps {
  transactions: Transaction[];
  totalCount: number;
  searchOptions: TransactionSearchOptions;
  onOptionsChange: (options: Partial<TransactionSearchOptions>) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function TransactionList({ 
  transactions, 
  totalCount, 
  searchOptions, 
  onOptionsChange,
  isLoading = false,
  error = null 
}: TransactionListProps): JSX.Element {
  const { t } = useI18n();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleViewDetails = (transaction: Transaction): void => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (): void => {
    setIsDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handlePageChange = (newPage: number): void => {
    onOptionsChange({ page: newPage });
  };

  const handleLimitChange = (newLimit: string): void => {
    onOptionsChange({ 
      limit: parseInt(newLimit),
      page: 1 // Reset to first page when changing page size
    });
  };

  const totalPages = Math.ceil(totalCount / searchOptions.limit);
  const currentPage = searchOptions.page;
  const startItem = ((currentPage - 1) * searchOptions.limit) + 1;
  const endItem = Math.min(currentPage * searchOptions.limit, totalCount);

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="size-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">{t('common.error')}</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && transactions.length === 0 && totalCount === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Receipt className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">{t('transactions.noTransactions')}</h3>
              <p className="text-muted-foreground">{t('transactions.noTransactionsDescription')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-5" />
                {t('transactions.title')}
              </CardTitle>
              <CardDescription>
                {totalCount > 0 ? (
                  t('transactions.showingTransactions', {
                    from: startItem,
                    to: endItem,
                    total: totalCount
                  })
                ) : (
                  'Loading transactions...'
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('transactions.transactionsPerPage')}:
              </span>
              <Select
                value={searchOptions.limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('transactions.page', { current: currentPage, total: totalPages })}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="size-4 mr-1" />
                  {t('transactions.previous')}
                </Button>
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  variant="outline"
                  size="sm"
                >
                  {t('transactions.next')}
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </>
  );
}
