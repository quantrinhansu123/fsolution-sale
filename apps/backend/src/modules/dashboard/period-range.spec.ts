import { getPeriodRanges } from "./period-range";

describe("getPeriodRanges", () => {
  it("day: trả về 5 ngày liên tiếp, thứ tự cũ -> mới, kỳ cuối là hôm nay (giờ VN)", () => {
    const now = new Date("2026-08-27T10:00:00Z"); // 17:00 VN cùng ngày
    const ranges = getPeriodRanges("day", 5, now);

    expect(ranges).toHaveLength(5);
    expect(ranges.map((r) => r.label)).toEqual(["23/08", "24/08", "25/08", "26/08", "27/08"]);
    expect(ranges[4].start.toISOString()).toBe("2026-08-26T17:00:00.000Z"); // 00:00 27/08 VN = 17:00 26/08 UTC
    expect(ranges[4].end.toISOString()).toBe("2026-08-27T17:00:00.000Z");
  });

  it("day: đúng cả khi 'now' rơi vào khoảng 00:00-07:00 giờ VN (còn là hôm qua theo UTC)", () => {
    const now = new Date("2026-08-27T01:00:00Z"); // 08:00 27/08 VN
    const ranges = getPeriodRanges("day", 5, now);
    expect(ranges[4].label).toBe("27/08");
  });

  it("week: kỳ cuối là tuần hiện tại (Thứ Hai -> Chủ Nhật, giờ VN), 5 tuần liên tiếp", () => {
    // 2026-08-27 là Thứ Năm -> tuần hiện tại bắt đầu Thứ Hai 2026-08-24
    const now = new Date("2026-08-27T10:00:00Z");
    const ranges = getPeriodRanges("week", 5, now);

    expect(ranges).toHaveLength(5);
    expect(ranges[4].label).toBe("24/08-30/08");
    expect(ranges[3].label).toBe("17/08-23/08");
    expect(ranges[0].label).toBe("27/07-02/08");
  });

  it("month: kỳ cuối là tháng hiện tại, 5 tháng liên tiếp, xử lý đúng khi bắc qua năm", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const ranges = getPeriodRanges("month", 5, now);

    expect(ranges.map((r) => r.label)).toEqual(["09/2025", "10/2025", "11/2025", "12/2025", "01/2026"]);
  });

  it("month: khoảng [start, end) của 1 tháng đúng theo giờ VN", () => {
    const now = new Date("2026-08-27T10:00:00Z");
    const ranges = getPeriodRanges("month", 5, now);
    const august = ranges.find((r) => r.label === "08/2026")!;

    expect(august.start.toISOString()).toBe("2026-07-31T17:00:00.000Z"); // 00:00 01/08 VN
    expect(august.end.toISOString()).toBe("2026-08-31T17:00:00.000Z"); // 00:00 01/09 VN
  });
});
