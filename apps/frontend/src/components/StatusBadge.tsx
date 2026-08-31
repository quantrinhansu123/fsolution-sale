const VARIANT_CLASSES = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-800",
} as const;

type Variant = keyof typeof VARIANT_CLASSES;

const LEAD_STATUS: Record<string, { label: string; variant: Variant }> = {
  new: { label: "Mới", variant: "neutral" },
  contacted: { label: "Đã liên hệ", variant: "warning" },
  qualified: { label: "Tiềm năng", variant: "warning" },
  converted: { label: "Đã chốt", variant: "success" },
  lost: { label: "Đã mất", variant: "danger" },
};

const ORDER_STATUS: Record<string, { label: string; variant: Variant }> = {
  pending: { label: "Chờ xử lý", variant: "neutral" },
  confirmed: { label: "Đã ký", variant: "warning" },
  shipped: { label: "Đang thực hiện", variant: "warning" },
  delivered: { label: "Đã nghiệm thu", variant: "success" },
  cancelled: { label: "Đã huỷ", variant: "danger" },
};

function Badge({ label, variant }: { label: string; variant: Variant }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {label}
    </span>
  );
}

export function LeadStatusBadge({ status }: { status: string }) {
  const meta = LEAD_STATUS[status] ?? { label: status, variant: "neutral" as const };
  return <Badge label={meta.label} variant={meta.variant} />;
}

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS[status] ?? { label: status, variant: "neutral" as const };
  return <Badge label={meta.label} variant={meta.variant} />;
}

const SHIPMENT_STATUS: Record<string, { label: string; variant: Variant }> = {
  preparing: { label: "Đang chuẩn bị", variant: "neutral" },
  shipping: { label: "Đang giao", variant: "warning" },
  delivered: { label: "Đã giao", variant: "success" },
  returned: { label: "Đã hoàn", variant: "danger" },
};

export function ShipmentStatusBadge({ status }: { status: string }) {
  const meta = SHIPMENT_STATUS[status] ?? { label: status, variant: "neutral" as const };
  return <Badge label={meta.label} variant={meta.variant} />;
}
