import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/ui';

interface ColumnPagerProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
}

/** Nút Previous / Next và số trang dùng chung cho các lưới nhiều cột */
export function ColumnPager({ page, pageCount, onPageChange, label }: ColumnPagerProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-3" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === 0}
        onClick={() => onPageChange(Math.max(0, page - 1))}
      >
        <ChevronLeft aria-hidden="true" />
        Previous
      </Button>
      <span className="text-xs font-medium text-muted-foreground">
        {page + 1} / {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === pageCount - 1}
        onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
      >
        Next
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
