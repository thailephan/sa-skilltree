# SA Skill Tree — Edtech 10M users

App học **Solution Architect** dạng game skill-tree: mỗi node gồm lý thuyết · khi nào dùng · ưu/nhược · câu hỏi + đáp án gợi ý · lab · nguồn tiếng Anh, có **cơ chế khóa** (clear node → mở khóa node phụ thuộc) và **máy tính capacity planning**.

- **Stack:** Next.js (App Router) + TypeScript + Supabase (Postgres + Auth magic link).
- **Deploy:** Vercel (frontend) + Supabase (DB/Auth).
- Chạy được ngay **không cần Supabase** (chế độ *local-only*, lưu tiến độ trong `localStorage`). Cắm key Supabase để bật đăng nhập + đồng bộ đa thiết bị.

---

## 1. Chạy local

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Không có `.env.local` → app chạy local-only. Muốn bật đồng bộ:

```bash
cp .env.local.example .env.local   # rồi điền URL + anon key Supabase
```

---

## 2. Tạo project Supabase (miễn phí)

1. Vào <https://supabase.com> → **New project** (đặt tên, chọn region gần VN như *Southeast Asia (Singapore)*, đặt DB password).
2. Mở **SQL Editor** → dán toàn bộ nội dung `supabase/schema.sql` → **Run**. (Tạo bảng `user_progress` + RLS.)
3. Vào **Project Settings → API**, lấy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Vào **Authentication → URL Configuration**: thêm **Site URL** = `http://localhost:3000` (dev) và sau khi có domain Vercel thì thêm cả `https://<app>.vercel.app`. Thêm cùng các URL đó vào **Redirect URLs** (kèm `/auth/callback`).
5. (Auth → Providers) **Email** đã bật sẵn magic link — không cần làm gì thêm cho MVP.

Điền 2 key vào `.env.local`, chạy lại `pnpm dev`, đăng nhập bằng email để test đồng bộ.

---

## 3. Đẩy lên GitHub

```bash
git add -A
git commit -m "feat: SA skill-tree app"
gh repo create sa-skilltree --public --source=. --push   # cần: gh auth login
```

> Chưa đăng nhập gh? Chạy `gh auth login` trong terminal của bạn trước (hoặc tạo repo thủ công trên github.com rồi `git remote add origin ... && git push -u origin main`).

---

## 4. Deploy lên Vercel

1. Vào <https://vercel.com> → đăng nhập bằng GitHub → **Add New → Project** → chọn repo `sa-skilltree`.
2. Framework tự nhận **Next.js**. Ở bước **Environment Variables**, thêm:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Sau khi có domain `https://<app>.vercel.app`:
   - Quay lại Supabase → **Authentication → URL Configuration** → thêm domain đó vào **Site URL** + **Redirect URLs** (`https://<app>.vercel.app/auth/callback`).
4. Mỗi lần `git push` → Vercel tự build & deploy.

---

## Cấu trúc

```
app/
  layout.tsx             # layout gốc
  page.tsx               # render <SkillTree/>
  auth/callback/route.ts # đổi magic-link code → session
  globals.css            # toàn bộ style (blueprint console theme)
components/SkillTree.tsx  # UI: tree, drawer, calculator, auth bar
lib/
  content.ts             # DỮ LIỆU 14 node (sửa nội dung học ở đây)
  useProgress.ts         # hook tiến độ: localStorage + đồng bộ Supabase
  supabase/{client,server}.ts
middleware.ts            # refresh session cookie
supabase/schema.sql      # bảng user_progress + RLS
```

Muốn thêm/sửa nội dung học: chỉ cần sửa mảng `NODES` trong `lib/content.ts`.
