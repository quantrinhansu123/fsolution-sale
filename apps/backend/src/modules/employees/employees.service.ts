import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Employee, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  list(): Promise<Employee[]> {
    return this.prisma.employee.findMany();
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    try {
      return await this.prisma.employee.create({ data: dto });
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Email hoặc tài khoản liên kết đã được dùng");
      throw err;
    }
  }

  async update(id: string, dto: UpdateEmployeeDto, changedBy?: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException("Không tìm thấy nhân sự");

    try {
      // Nguyên tắc #5 (implementation_plan.md): đổi role/status nhân sự (phân quyền/vô hiệu
      // hoá) phải có log, cùng transaction với update.
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.employee.update({ where: { id }, data: dto });

        for (const field of ["role", "status"] as const) {
          if (dto[field] !== undefined && dto[field] !== employee[field]) {
            await this.auditLogsService.record(
              {
                tableName: "Employee",
                recordId: id,
                fieldChanged: field,
                oldValue: employee[field],
                newValue: dto[field] as string,
                changedBy,
              },
              tx
            );
          }
        }

        return updated;
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Tài khoản liên kết đã được dùng cho nhân sự khác");
      throw err;
    }
  }
}
