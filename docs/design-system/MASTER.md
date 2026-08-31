# Design System: F-Solution (SaaS CRM/ERP — IT Company)

> Cập nhật: 2026-08-28 — Áp dụng skill `ui-ux-pro-max` — Chuyển sang Tech Minimalism cho mô hình kinh doanh phần mềm B2B.

## 1. Domain & Vibe
- **Domain**: Hệ thống nội bộ CRM/ERP cho **công ty phần mềm B2B** (F-Solution). Người dùng là nhân viên nội bộ (Admin, Sale, Marketing, CSKH, Kế toán).
- **Style**: **Tech Minimalism** — phong cách chuẩn SaaS toàn cầu (Notion, Linear, Vercel). Ưu tiên: trắng sạch, khoảng trắng rộng, phân cấp thông tin rõ ràng, tối giản decorator, tập trung vào nội dung.
- **Vibe**: Chuyên nghiệp, hiện đại, nhẹ nhàng, đáng tin cậy. Không rối mắt.

## 2. Layout Pattern
- **Cấu trúc**: Sidebar bên trái (dark, `slate-900`) + Main Content Area (trắng/xám nhạt).
- **Header**: Sticky header trên Main Content — tiêu đề trang + user info.
- **Card-based**: Nội dung đặt trong cards `bg-white shadow-sm rounded-xl`.
- **Mobile**: Sidebar collapse thành hamburger menu `< 768px`.

## 3. Color Palette

### Primary Brand — Indigo (Tech SaaS chuẩn)
| Token | Hex | Dùng cho |
|---|---|---|
| `indigo-50` | `#EEF2FF` | Nền badge nhạt, nền selected state |
| `indigo-100` | `#E0E7FF` | Nền tag/chip |
| `indigo-500` | `#6366F1` | Focus ring, border active |
| `indigo-600` | `#4F46E5` | **Primary button, active nav** |
| `indigo-700` | `#4338CA` | Hover state nút chính |
| `indigo-800` | `#3730A3` | Text trên badge nhạt |

> ⚠️ **Trong CSS**: các class `amber-*` đã bị ghi đè thành màu indigo trong `index.css` — toàn bộ 20+ page tự động đổi màu mà không cần sửa từng file.

### Sidebar — Dark Slate
| Token | Hex | Dùng cho |
|---|---|---|
| `slate-900` | `#0F172A` | Sidebar background |
| `slate-800` | `#1E293B` | Active nav item background |
| `slate-400` | `#94A3B8` | Nav icon/text mặc định |
| `white` | `#FFFFFF` | Active nav icon/text |

### Neutral
| Token | Hex | Dùng cho |
|---|---|---|
| `gray-50` | `#F9FAFB` | Body background |
| `white` | `#FFFFFF` | Card/surface background |
| `gray-900` | `#111827` | Heading text |
| `gray-600` | `#4B5563` | Body text |
| `gray-400` | `#9CA3AF` | Muted/placeholder |

### Status Colors
| Trạng thái | Background | Text |
|---|---|---|
| Success | `emerald-100` | `emerald-800` |
| Warning | `yellow-100` | `yellow-800` |
| Error | `red-100` | `red-800` |
| Neutral | `gray-100` | `gray-800` |
| Info | `indigo-50` | `indigo-800` |

## 4. Typography
- **Font**: **Inter** (Google Fonts) — chuẩn SaaS toàn cầu, tải qua `<link>` trong `index.html`.
- **Heading h1**: `text-2xl font-bold text-gray-900 tracking-tight`
- **Heading h2 (Card)**: `text-lg font-semibold text-gray-800`
- **Body**: `text-sm text-gray-600`
- **Label form**: `text-sm font-medium text-gray-700`
- **Muted**: `text-xs text-gray-400`

## 5. UI Components

### Buttons
- **Primary**: `bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer`
- **Secondary**: `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg px-4 py-2 cursor-pointer`
- **Destructive**: `bg-red-600 hover:bg-red-700 text-white` (chỉ dùng cho xóa/hủy quan trọng)

> **Quy tắc 2 màu nút**: Chỉ Primary (indigo) và Secondary (trắng-viền). Không tự thêm màu nút thứ 3.

### Cards
```
bg-white rounded-xl shadow-sm border border-gray-100 p-5
```

### Tables
- Header: `bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider`
- Row: `hover:bg-gray-50 transition-colors`
- Border: `border-b border-gray-100`

### Form Inputs
```
w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
```

### Badges/Status Chips
- `rounded-full px-2.5 py-0.5 text-xs font-medium` + màu theo trạng thái
- Luôn kèm text label (không dựa vào màu đơn độc — WCAG accessibility)

### Sidebar Nav Item (active)
```
bg-slate-800 text-white — với border-l-2 border-indigo-400 ở bên trái
```

## 6. UX & Accessibility Checklist
- [ ] `cursor-pointer` trên tất cả clickable elements
- [ ] Không dùng emoji làm icon — dùng Lucide React
- [ ] Contrast WCAG 4.5:1: text trắng trên `indigo-600` ✓
- [ ] Responsive: 375px / 768px / 1024px+
- [ ] Focus states rõ ràng (`focus:ring-2 focus:ring-indigo-500`)
- [ ] `overflow-x-auto` bọc ngoài tất cả tables

## 7. Anti-Patterns (KHÔNG làm)
- ❌ Không dùng màu xanh lá rêu `#428000` — màu cũ của dự án sàn gỗ, không phù hợp IT
- ❌ Không dùng > 2 màu nút trên cùng 1 trang
- ❌ Không để text truncate mà không có tooltip
- ❌ Không dùng `border border-gray-200` cho khối lặp trong form — dùng nền tint nhạt `bg-gray-50/70`
- ❌ Không dùng `<input readOnly>` cho trường chỉ hiển thị — dùng text nhỏ `text-xs text-gray-500`
