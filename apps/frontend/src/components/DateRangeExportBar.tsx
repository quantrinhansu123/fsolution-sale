interface DateRangeExportBarProps {
  idPrefix: string;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onExport: () => void;
  exportDisabled?: boolean;
}

export function DateRangeExportBar({
  idPrefix,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onExport,
  exportDisabled
}: DateRangeExportBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <label htmlFor={`${idPrefix}-from-date`} className="text-xs font-medium text-gray-500 whitespace-nowrap">
          Từ ngày
        </label>
        <input
          id={`${idPrefix}-from-date`}
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="px-1.5 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor={`${idPrefix}-to-date`} className="text-xs font-medium text-gray-500 whitespace-nowrap">
          Đến ngày
        </label>
        <input
          id={`${idPrefix}-to-date`}
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="px-1.5 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
        />
      </div>
      <button
        type="button"
        onClick={onExport}
        disabled={exportDisabled}
        className="py-1 px-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
      >
        Xuất Excel
      </button>
    </div>
  );
}
