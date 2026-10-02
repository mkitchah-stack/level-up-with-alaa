# LEVEL UP WITH ALAA — BAC 2027

منصة ويب لبرنامج الـ132 يومًا: حسابات الطلاب، مهام كل يوم، النجوم، سلسلة الإنجاز، الاستدراك (Catch-up)، المراجعات الأسبوعية والشهرية، التحقق النهائي، ولوحة إدارة للتفعيل والدفع اليدوي والمحتوى.

**التقنيات:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres + RLS + Storage) · نشر على Vercel.

---

## 1. التشغيل محليًا

```bash
npm install
cp .env.example .env.local     # ثم ضعي قيم Supabase
npm run dev                    # http://localhost:3000
```

أوامر أخرى:

| الأمر | الوظيفة |
|---|---|
| `npm run build` | بناء نسخة الإنتاج |
| `npm run typecheck` | فحص TypeScript |
| `npm run lint` | فحص ESLint |
| `npm run test:logic` | اختبارات منطق البرنامج (9) |
| `npm run test:db` | اختبارات الأمان (55) على Postgres محلي — اختياري، يحتاج `psql` |

## 2. متغيرات البيئة

| المتغير | المصدر | ملاحظة |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | عام |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | نفس الصفحة (anon / public) | عام وآمن: الحماية تتم عبر RLS |
| `NEXT_PUBLIC_SITE_URL` | رابط موقعك | لروابط تأكيد البريد واستعادة كلمة المرور |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **غير مستخدم** في هذا المشروع. لا تضيفيه إلى Vercel ولا إلى أي متغير يبدأ بـ `NEXT_PUBLIC_`.

## 3. ربط Supabase

1. في Supabase: **SQL Editor > New query** > الصقي `supabase/schema.sql` كاملًا > **Run**.
   - الملف آمن لإعادة التشغيل، ويعمل فوق النسخة القديمة دون حذف أي بيانات.
2. استعلام جديد > الصقي `supabase/seed_import.sql` (**v2**) > **Run**.
   - نفس بيانات النسخة الأولى حرفيًا (تم التحقق بمقارنة الجداول سطرًا بسطر).
   - يعمل داخل transaction واحدة، وينتهي بفحص ذاتي: 132 / 396 / 335.
   - إعادة تشغيله **لا تمسح** أي تعديل قمتِ به من لوحة الإدارة (العناوين، الأوصاف، الفيديوهات، المصادر، نصوص الخطوات).
   - ⚠️ لا تستعملي النسخة القديمة: إعادة تشغيلها تُرجع العناوين ونصوص الخطوات المصحَّحة إلى نصها الأصلي المعطوب.
   - لإعادة توليده من الـJSON: `python3 scripts/generate_seed.py`.
3. للتحقق:
   ```sql
   select (select count(*) from program_days) days,
          (select count(*) from program_tasks) tasks,
          (select count(*) from program_checklist_items) items;
   ```
   النتيجة المتوقعة: `132 | 396 | 335`.
4. **Authentication > URL Configuration**:
   - Site URL = رابط موقعك.
   - Redirect URLs: أضيفي `https://رابط-موقعك/auth/callback` و`http://localhost:3000/auth/callback`.
5. **Authentication > Providers > Email**: اتركي "Confirm email" مفعّلًا (موصى به).
6. أنشئي حساب الأدمن: سجّلي من الموقع بشكل عادي، ثم نفّذي في SQL Editor:
   ```sql
   update public.profiles set role = 'admin', account_status = 'active'
    where email = 'بريدك@example.com';
   ```
7. من لوحة الإدارة > الإعدادات: ضعي السعر وتعليمات الدفع (RIP / CCP) ووسيلة التواصل.

> **ملاحظة البريد:** خدمة البريد المدمجة في Supabase محدودة جدًا (بضع رسائل في الساعة). قبل الإطلاق اربطي SMTP خاصًا من Authentication > Emails > SMTP Settings، مثل Resend أو Brevo.

## 4. النشر على Vercel

1. ارفعي المجلد إلى مستودع GitHub **خاص**. لا ترفعي `.env.local`، فهو مستثنى في `.gitignore`.
2. في vercel.com: **Add New > Project** > اختاري المستودع. سيُكتشف Next.js تلقائيًا.
3. أضيفي متغيرات البيئة الثلاثة ثم **Deploy**.
4. بعد النشر:
   - حدّثي `NEXT_PUBLIC_SITE_URL` بالرابط النهائي، ثم Redeploy.
   - حدّثي Site URL وRedirect URLs في Supabase بنفس الرابط.

## 5. رحلة الطالب

1. ينشئ الطالب حسابًا ويؤكد بريده، فتُنشأ له تلقائيًا صفحة `/pending` بحالة `pending`.
2. يرفع إثبات الدفع (صورة أو PDF، حتى 5MB). الملف خاص، لا يراه إلا هو والأدمن.
3. الأدمن يقبل الطلب من **الإدارة > المدفوعات**، فيُفعَّل الحساب تلقائيًا ويُضبط **تاريخ البداية = اليوم 1**.
4. الطالب يرى البرنامج كاملًا. كل علامة إنجاز تُحفظ فورًا في Supabase.

## 6. القواعد الحسابية (`src/lib/programLogic.js`)

- **المهمة المكتملة:** كل خطوات الـchecklist معلَّمة، أو زر "تم الإنجاز" إن لم تكن لها خطوات.
- **النجوم:** نجمة لكل مهمة مكتملة. المجموع 396.
- **اليوم الحالي:** الأيام منذ تاريخ البداية + 1، بتوقيت الجزائر، بين 1 و132.
- **سلسلة الإنجاز:** عدد الأيام المكتملة المتتالية المنتهية باليوم الحالي. اليوم الجاري لا يكسر السلسلة قبل نهايته.
- **الاستدراك:** كل مهمة غير مكتملة من يوم سابق لليوم الحالي. لا تختفي حتى تُنجَز.
- **المراجعات:**
  - نجوم مفقودة = مهام أيام مضت ولم تُنجَز.
  - نجوم مستدركة = مهام أُنجزت بعد تاريخها المقرر.

## 7. الأمان

| الطبقة | ما يمنعه |
|---|---|
| RLS على كل الجداول | الطالب لا يقرأ ولا يكتب إلا صفوفه |
| Trigger `guard_profile_update` | الطالب لا يغيّر `role` ولا `account_status` ولا تاريخ البداية |
| سياسة الإدراج في `payment_requests` | لا يمكن إنشاء طلب إلا بحالة `pending` |
| دوال admin (`security definer`) | تتحقق من صلاحية الأدمن داخل قاعدة البيانات |
| Storage | كل طالب يرفع في مجلده فقط، والملفات خاصة |
| CSP + Security headers | حماية من الإطار المضمَّن وحقن السكربتات |
| قيود DB على الروابط | روابط الفيديو والصور يجب أن تبدأ بـ `https://` |

حراسة الصفحات في الواجهة (redirects) هي لتجربة الاستخدام فقط. **الحماية الفعلية في قاعدة البيانات.**

## 8. مراجعة المحتوى

`content-review/arabic_text_issues.csv` يحتوي 255 نصًا (عناوين، أوصاف، خطوات) يظهر فيها خلل في الحروف، مثل `االجتماعية` و`األستاذة` و`ملخًصا`.

- **المصدر:** طبقة النص داخل ملف الـPDF نفسه، والـSeed نقلها كما هي.
- **ما لم يُفعل:** لم يُصحَّح شيء آليًا، لأن التصحيح يتطلب تخمينًا.
- **التصحيح:** من **الإدارة > المحتوى** (اليوم ورقم المهمة موجودان في الملف)، بالمقارنة مع الـPDF.
- أسماء المواد الخمس تُعرض بصيغتها الصحيحة في الواجهة من `src/lib/subjects.ts`.

## 9. هيكل المشروع

```
supabase/          schema.sql (v2) · seed_import.sql · level-up-132-days-schema.json
src/lib/           programLogic.js · data.ts · supabase/ · media.ts · subjects.ts
src/components/    ProgressProvider · AppShell · TaskCard · DayView · ReviewEditor …
src/app/           page (Landing) · (auth)/ · pending/ · (student)/ · admin/ · auth/
tests/             programLogic.test.mjs · db/ (mock + 55 security tests)
docs/screenshots/  لقطات الهاتف / التابلت / الحاسوب
```
