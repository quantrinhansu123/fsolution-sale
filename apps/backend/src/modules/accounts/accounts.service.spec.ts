import { randomUUID } from "crypto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AccountsService } from "./accounts.service";

describe("AccountsService", () => {
  const prisma = new PrismaService();
  const service = new AccountsService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function uniqueUsername() {
    return `test-${randomUUID().slice(0, 8)}`;
  }

  it("create() tạo tài khoản mới với mật khẩu mặc định abc123 (đã hash)", async () => {
    const username = uniqueUsername();
    const created = await service.create({ username });

    expect(created.username).toBe(username);
    expect(created.isAdmin).toBe(false);

    const stored = await prisma.account.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.passwordHash).not.toBe("abc123");
    expect(await bcrypt.compare("abc123", stored.passwordHash)).toBe(true);
  });

  it("update() đổi username", async () => {
    const created = await service.create({ username: uniqueUsername() });
    const newUsername = uniqueUsername();

    const updated = await service.update(created.id, { username: newUsername });
    expect(updated.username).toBe(newUsername);
  });

  it("update() với resetPassword=true đặt lại mật khẩu về abc123", async () => {
    const created = await service.create({ username: uniqueUsername() });
    await prisma.account.update({
      where: { id: created.id },
      data: { passwordHash: await bcrypt.hash("da-doi-mat-khau", 10) },
    });

    await service.update(created.id, { resetPassword: true });

    const stored = await prisma.account.findUniqueOrThrow({ where: { id: created.id } });
    expect(await bcrypt.compare("abc123", stored.passwordHash)).toBe(true);
  });

  it("create() với password tuỳ chỉnh dùng đúng mật khẩu đó thay vì mặc định", async () => {
    const created = await service.create({ username: uniqueUsername(), password: "mat-khau-rieng" });

    const stored = await prisma.account.findUniqueOrThrow({ where: { id: created.id } });
    expect(await bcrypt.compare("mat-khau-rieng", stored.passwordHash)).toBe(true);
    expect(await bcrypt.compare("abc123", stored.passwordHash)).toBe(false);
  });

  it("update() với newPassword đặt mật khẩu tuỳ chỉnh, ưu tiên hơn resetPassword", async () => {
    const created = await service.create({ username: uniqueUsername() });

    await service.update(created.id, { resetPassword: true, newPassword: "mat-khau-moi" });

    const stored = await prisma.account.findUniqueOrThrow({ where: { id: created.id } });
    expect(await bcrypt.compare("mat-khau-moi", stored.passwordHash)).toBe(true);
    expect(await bcrypt.compare("abc123", stored.passwordHash)).toBe(false);
  });

  it("create() ném ConflictException (409) khi username đã tồn tại, không phải lỗi 500 thô", async () => {
    const username = uniqueUsername();
    await service.create({ username });

    await expect(service.create({ username })).rejects.toThrow(ConflictException);
  });

  it("update() ném ConflictException (409) khi đổi sang username đã tồn tại", async () => {
    const takenUsername = uniqueUsername();
    await service.create({ username: takenUsername });
    const other = await service.create({ username: uniqueUsername() });

    await expect(service.update(other.id, { username: takenUsername })).rejects.toThrow(
      ConflictException
    );
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { username: uniqueUsername() })).rejects.toThrow(
      NotFoundException
    );
  });

  it("remove() xoá tài khoản thường thành công", async () => {
    const created = await service.create({ username: uniqueUsername() });
    await service.remove(created.id);

    const stored = await prisma.account.findUnique({ where: { id: created.id } });
    expect(stored).toBeNull();
  });

  it("remove() từ chối xoá admin cuối cùng (409)", async () => {
    // KHÔNG được deleteMany() tài khoản admin thật đang có trong DB dùng chung (đã từng gây lỗi
    // thật: xoá mất "admin"/"abc123" thật đang chạy) — giả lập "đây là admin cuối cùng" bằng cách
    // mock riêng prisma.account.count() cho đúng 1 test này, không đụng dữ liệu ngoài phạm vi test.
    const admin = await prisma.account.create({
      data: { username: uniqueUsername(), passwordHash: await bcrypt.hash("abc123", 10), isAdmin: true },
    });

    const countSpy = jest.spyOn(prisma.account, "count").mockResolvedValue(1);
    try {
      await expect(service.remove(admin.id)).rejects.toThrow(ConflictException);
    } finally {
      countSpy.mockRestore();
    }

    const stored = await prisma.account.findUnique({ where: { id: admin.id } });
    expect(stored).not.toBeNull();

    await prisma.account.delete({ where: { id: admin.id } });
  });

  it("remove() cho phép xoá admin nếu còn admin khác", async () => {
    const admin1 = await prisma.account.create({
      data: { username: uniqueUsername(), passwordHash: await bcrypt.hash("abc123", 10), isAdmin: true },
    });
    const admin2 = await prisma.account.create({
      data: { username: uniqueUsername(), passwordHash: await bcrypt.hash("abc123", 10), isAdmin: true },
    });

    await service.remove(admin1.id);

    const stored = await prisma.account.findUnique({ where: { id: admin1.id } });
    expect(stored).toBeNull();
    // dọn lại để không ảnh hưởng test khác
    await prisma.account.delete({ where: { id: admin2.id } });
  });

  it("setPermissions() rồi getPermissions() phản ánh đúng ma trận quyền vừa lưu", async () => {
    const created = await service.create({ username: uniqueUsername() });

    await service.setPermissions(created.id, [
      { module: "leads", canView: true, canEdit: false, canDelete: false },
    ]);
    let permissions = await service.getPermissions(created.id);
    expect(permissions).toEqual([
      expect.objectContaining({ module: "leads", canView: true, canEdit: false, canDelete: false }),
    ]);

    // gọi lại lần 2 với giá trị khác -> upsert phải cập nhật, không tạo dòng mới
    await service.setPermissions(created.id, [
      { module: "leads", canView: true, canEdit: true, canDelete: true },
    ]);
    permissions = await service.getPermissions(created.id);
    expect(permissions).toHaveLength(1);
    expect(permissions[0]).toEqual(
      expect.objectContaining({ module: "leads", canView: true, canEdit: true, canDelete: true })
    );
  });

  it("update() đổi username tự ghi AuditLog (mới Phase 3)", async () => {
    const created = await service.create({ username: uniqueUsername() });
    const newUsername = uniqueUsername();
    const changedBy = randomUUID();

    await service.update(created.id, { username: newUsername }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Account", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "username", newValue: newUsername, changedBy });
  });

  it("remove() tự ghi AuditLog fieldChanged=deleted (mới Phase 3)", async () => {
    const created = await service.create({ username: uniqueUsername() });
    const changedBy = randomUUID();

    await service.remove(created.id, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Account", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "deleted", oldValue: created.username, changedBy });
  });

  it("setPermissions() tự ghi AuditLog cho từng field quyền thay đổi (mới Phase 3)", async () => {
    const created = await service.create({ username: uniqueUsername() });
    const changedBy = randomUUID();

    await service.setPermissions(created.id, [{ module: "leads", canView: true, canEdit: false, canDelete: false }], changedBy);
    const logsAfterFirst = await prisma.auditLog.findMany({ where: { tableName: "Permission", recordId: `${created.id}:leads` } });
    expect(logsAfterFirst).toHaveLength(1);
    expect(logsAfterFirst[0]).toMatchObject({ fieldChanged: "canView", oldValue: "false", newValue: "true", changedBy });

    await service.setPermissions(created.id, [{ module: "leads", canView: true, canEdit: true, canDelete: false }], changedBy);
    const logsAfterSecond = await prisma.auditLog.findMany({ where: { tableName: "Permission", recordId: `${created.id}:leads` } });
    expect(logsAfterSecond).toHaveLength(2);
    expect(logsAfterSecond[1]).toMatchObject({ fieldChanged: "canEdit", oldValue: "false", newValue: "true", changedBy });
  });
});
