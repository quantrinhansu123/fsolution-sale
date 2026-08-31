// Mới (Phase 3) — dùng chung cho các Service cần ghi AuditLog theo từng field thay đổi lúc update()
// (thay vì chỉ check 1 field như Orders/Payments/SystemConfig đã làm trước đó).
export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export function diffFields(entity: Record<string, unknown>, dto: Record<string, unknown>): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const [field, newValue] of Object.entries(dto)) {
    if (newValue === undefined) continue;
    const oldValue = entity[field];
    if (String(oldValue) !== String(newValue)) {
      changes.push({ field, oldValue: String(oldValue), newValue: String(newValue) });
    }
  }
  return changes;
}
