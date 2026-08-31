import { useMemo, useState } from 'react';
import { CHART_INK, colorForIndex } from './chartPalette';

export interface TrendSeries {
  name: string;
  values: number[]; // cùng độ dài với periods
  color?: string; // bỏ trống để tự gán theo thứ tự categorical cố định
}

interface TrendLineChartProps {
  periods: string[];
  series: TrendSeries[];
  formatValue?: (value: number) => string;
  height?: number;
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 8 };
const WIDTH = 640;

export function TrendLineChart({ periods, series, formatValue, height = 240 }: TrendLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const fmt = formatValue ?? ((v: number) => new Intl.NumberFormat('vi-VN').format(v));

  const colored = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? colorForIndex(i) })),
    [series]
  );

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const maxValue = Math.max(1, ...colored.flatMap((s) => s.values));
  const yScale = (v: number) => innerHeight - (v / maxValue) * innerHeight;
  const xScale = (i: number) => (periods.length <= 1 ? innerWidth / 2 : (i / (periods.length - 1)) * innerWidth);

  const gridLines = 4;

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
        aria-label="Biểu đồ biến động theo kỳ"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {Array.from({ length: gridLines + 1 }, (_, i) => {
            const y = (innerHeight / gridLines) * i;
            const value = maxValue * (1 - i / gridLines);
            return (
              <g key={i}>
                <line x1={0} x2={innerWidth} y1={y} y2={y} stroke={CHART_INK.gridline} strokeWidth={1} />
                <text x={0} y={y - 4} fontSize={10} fill={CHART_INK.muted}>
                  {fmt(value)}
                </text>
              </g>
            );
          })}

          {colored.map((s) => {
            const points = s.values.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
            return (
              <g key={s.name}>
                <polyline points={points} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {s.values.map((v, i) => (
                  <circle key={i} cx={xScale(i)} cy={yScale(v)} r={4} fill={s.color} stroke={CHART_INK.surface} strokeWidth={1.5} />
                ))}
              </g>
            );
          })}

          {periods.map((label, i) => (
            <text key={label} x={xScale(i)} y={innerHeight + 20} fontSize={10} fill={CHART_INK.muted} textAnchor="middle">
              {label}
            </text>
          ))}

          {hoverIndex !== null && (
            <line
              x1={xScale(hoverIndex)}
              x2={xScale(hoverIndex)}
              y1={0}
              y2={innerHeight}
              stroke={CHART_INK.baseline}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}

          {periods.map((_, i) => (
            <rect
              key={i}
              x={xScale(i) - innerWidth / periods.length / 2}
              y={0}
              width={innerWidth / periods.length}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
        </g>
      </svg>

      {hoverIndex !== null && (
        <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs space-y-1 max-w-xs">
          <div className="font-medium text-gray-700">{periods[hoverIndex]}</div>
          {colored.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
              <span className="font-medium text-gray-900">{fmt(s.values[hoverIndex])}</span>
            </div>
          ))}
        </div>
      )}

      {colored.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {colored.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
