// Giờ Việt Nam (+07:00) — khớp TZ_OFFSET dùng ở SaleReportsService, toàn bộ nghiệp vụ dự án này
// chạy theo múi giờ VN.
const TZ_OFFSET = "+07:00";

export type DashboardPeriodType = "day" | "week" | "month";

export interface PeriodRange {
  label: string;
  start: Date;
  end: Date; // exclusive
  // Biên theo lịch (YYYY-MM-DD) của chính kỳ này — dùng khi so với cột kiểu `@db.Date`
  // (không có giờ/múi giờ). Nếu so cột `@db.Date` với `start`/`end` (mốc nửa đêm giờ VN =
  // 17:00Z hôm trước) thì Prisma cắt phần giờ, lệch nguyên 1 ngày ở cả hai đầu.
  startDate: string;
  endDate: string; // exclusive
}

// Mốc nửa đêm UTC của một ngày lịch — khớp cách Prisma diễn giải cột `@db.Date`.
export function utcDateBoundary(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function vnDateOnly(d: Date): string {
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function startOfVnDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00${TZ_OFFSET}`);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(dateStr: string): number {
  // 0=CN(Sun) .. 6=Thứ Bảy(Sat)
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

function formatDDMM(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

// Trả về `count` kỳ gần nhất (bao gồm kỳ hiện tại, có thể chưa kết thúc), thứ tự cũ -> mới.
export function getPeriodRanges(period: DashboardPeriodType, count: number, now: Date = new Date()): PeriodRange[] {
  const todayStr = vnDateOnly(now);

  if (period === "day") {
    const ranges: PeriodRange[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const dateStr = addDays(todayStr, -i);
      const nextStr = addDays(dateStr, 1);
      ranges.push({
        label: formatDDMM(dateStr),
        start: startOfVnDay(dateStr),
        end: startOfVnDay(nextStr),
        startDate: dateStr,
        endDate: nextStr,
      });
    }
    return ranges;
  }

  if (period === "week") {
    const dow = weekdayOf(todayStr);
    const daysSinceMonday = dow === 0 ? 6 : dow - 1;
    const thisMonday = addDays(todayStr, -daysSinceMonday);

    const ranges: PeriodRange[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const mondayStr = addDays(thisMonday, -7 * i);
      const sundayStr = addDays(mondayStr, 6);
      const nextMondayStr = addDays(sundayStr, 1);
      ranges.push({
        label: `${formatDDMM(mondayStr)}-${formatDDMM(sundayStr)}`,
        start: startOfVnDay(mondayStr),
        end: startOfVnDay(nextMondayStr),
        startDate: mondayStr,
        endDate: nextMondayStr,
      });
    }
    return ranges;
  }

  // month
  const [y, m] = todayStr.split("-").map(Number);
  const currentTotalMonth = y * 12 + (m - 1); // 0-indexed month count kể từ năm 0

  const ranges: PeriodRange[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const totalMonth = currentTotalMonth - i;
    const yy = Math.floor(totalMonth / 12);
    const mm = totalMonth % 12; // 0-indexed
    const startStr = `${yy}-${String(mm + 1).padStart(2, "0")}-01`;
    const nextTotal = totalMonth + 1;
    const nyy = Math.floor(nextTotal / 12);
    const nmm = nextTotal % 12;
    const endStr = `${nyy}-${String(nmm + 1).padStart(2, "0")}-01`;
    ranges.push({
      label: `${String(mm + 1).padStart(2, "0")}/${yy}`,
      start: startOfVnDay(startStr),
      end: startOfVnDay(endStr),
      startDate: startStr,
      endDate: endStr,
    });
  }
  return ranges;
}
