import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationProps } from '@/types/items';

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const generatePageNumbers = (): number[] => {
    const { currentPage, totalPages } = pagination;
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return Array.from({ length: maxVisiblePages }, (_, i) => i + 1);
    }
    
    if (currentPage >= totalPages - 2) {
      return Array.from({ length: maxVisiblePages }, (_, i) => totalPages - maxVisiblePages + i + 1);
    }
    
    return Array.from({ length: maxVisiblePages }, (_, i) => currentPage - 2 + i);
  };

  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {generatePageNumbers().map(pageNumber => (
                <Button
                  key={pageNumber}
                  variant={pagination.currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
