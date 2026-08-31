import { useState } from 'react';
import { CHART_INK, colorForIndex } from './chartPalette';

export interface StackSegment {
  key: string;
  label: string;
  color?: string;
}

interface StackedBarChartProps {
  periods: string[];
  segments: StackSegment[]; // thứ tự cố định
  data: { period: string; byStatus: Record<string, number> }[];
  height?: number;
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 8 };
const WIDTH = 640;
const SEGMENT_GAP = 2;

export function StackedBarChart({ periods, segments, data, height = 240 }: StackedBarChartProps) {
  const [hover, setHover] = useState<{ periodIndex: number; segmentKey: string } | null>(null);

  const colored = segments.map((s, i) => ({ ...s, color: s.color ?? colorForIndex(i) }));

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const totals = data.map((d) => colored.reduce((sum, s) => sum + (d.byStatus[s.key] ?? 0), 0));
  const maxTotal = Math.max(1, ...totals);

  const barWidth = Math.min(48, (innerWidth / periods.length) * 0.6);
  const slotWidth = innerWidth / periods.length;

  if (periods.length === 0) {
    return <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>;
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        style={{ background: CHART_INK.surface }}
        role="img"
        aria-label="Biểu đồ số lượng và trạng thái theo kỳ"
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke={CHART_INK.baseline} strokeWidth={1} />

          {data.map((d, periodIndex) => {
            const x = slotWidth * periodIndex + (slotWidth - barWidth) / 2;
            let yCursor = innerHeight;
            return (
              <g key={d.period}>
                {colored.map((s) => {
                  const value = d.byStatus[s.key] ?? 0;
                  if (value === 0) return null;
                  const segHeight = (value / maxTotal) * innerHeight;
                  const y = yCursor - segHeight;
                  yCursor = y - SEGMENT_GAP;
                  const isHovered = hover?.periodIndex === periodIndex && hover?.segmentKey === s.key;
                  return (
                    <rect
                      key={s.key}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(0, segHeight)}
                      rx={2}
                      fill={s.color}
                      opacity={hover && !isHovered ? 0.55 : 1}
                      onMouseEnter={() => setHover({ periodIndex, segmentKey: s.key })}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })}
              </g>
            );
          })}

          {periods.map((label, i) => (
            <text key={label} x={slotWidth * i + slotWidth / 2} y={innerHeight + 20} fontSize={10} fill={CHART_INK.muted} textAnchor="middle">
              {label}
            </text>
          ))}
        </g>
      </svg>

      <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs min-h-[64px]">
        {hover ? (
          <div>
            <div className="font-medium text-gray-700">{periods[hover.periodIndex]}</div>
            <div className="flex items-center justify-between gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: colored.find((s) => s.key === hover.segmentKey)?.color }}
                />
                {colored.find((s) => s.key === hover.segmentKey)?.label}
              </span>
              <span className="font-medium text-gray-900">
                {new Intl.NumberFormat('vi-VN').format(data[hover.periodIndex]?.byStatus[hover.segmentKey] ?? 0)}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">Di chuột vào biểu đồ để xem chi tiết từng trạng thái.</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {colored.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
