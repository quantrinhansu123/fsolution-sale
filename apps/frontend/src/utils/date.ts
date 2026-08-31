// Giờ Việt Nam (+07:00) — khớp TZ_OFFSET backend dùng để tính các báo cáo tự động (SaleReportAuto,
// MarketingReportAuto...), tránh lệch 1 ngày khi khách xem trang trong khoảng 00:00-07:00 giờ VN
// (lúc ngày UTC vẫn còn là hôm qua).
export function today(): string {
  const now = new Date();
  const vnShifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnShifted.toISOString().slice(0, 10);
}
