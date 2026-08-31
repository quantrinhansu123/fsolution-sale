// Bảng màu categorical đã validate colorblind-safe (xem skill dataviz — references/palette.md).
// Thứ tự CỐ ĐỊNH — không đảo, không cycle ngẫu nhiên (đây là cơ chế an toàn CVD, không phải thẩm mỹ).
export const CATEGORICAL_COLORS = [
  '#2a78d6', // 1 blue
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948' // 8 red
];

// Màu trạng thái cố định — không dùng cho series, không tái sử dụng cho ý nghĩa khác.
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b'
};

export const CHART_INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  surface: '#fcfcfb'
};

export function colorForIndex(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}
