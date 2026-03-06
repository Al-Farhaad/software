interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationControlsProps) => {
  if (totalItems <= pageSize) {
    return null;
  }

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--tf-border)] bg-white px-3 py-2">
      <p className="text-xs text-slate-500">
        Showing {firstItem}-{lastItem} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="tf-btn-outline px-3 py-1.5 text-xs"
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <p className="text-xs font-semibold text-[var(--tf-navy)]">
          Page {currentPage} / {totalPages}
        </p>
        <button
          className="tf-btn-outline px-3 py-1.5 text-xs"
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};
