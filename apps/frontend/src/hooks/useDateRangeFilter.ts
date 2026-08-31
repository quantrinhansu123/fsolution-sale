import { useMemo, useState } from 'react';

// So sánh theo yyyy-MM-dd (khớp định dạng input type="date") — cắt phần giờ nếu getDate trả về ISO datetime.
export function useDateRangeFilter<T>(items: T[], getDate: (item: T) => string | null | undefined) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {
    if (!fromDate && !toDate) return items;
    return items.filter((item) => {
      const raw = getDate(item);
      if (!raw) return false;
      const day = raw.slice(0, 10);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      return true;
    });
  }, [items, fromDate, toDate, getDate]);

  return { fromDate, setFromDate, toDate, setToDate, filtered };
}
