# 🤖 بوت التسليم التلقائي عبر تيليجرام

بوت تيليجرام لبيع وتسليم المنتجات الرقمية (أكواد، ملفات، روابط، حسابات) تلقائيًا، مع لوحة تحكم ويب كاملة للإدارة.

## المكونات

| الطبقة | التقنية |
|---|---|
| البوت | [grammy](https://grammy.dev) + `@grammyjs/conversations` |
| قاعدة البيانات | SQLite عبر `better-sqlite3` |
| ORM | Drizzle ORM |
| API | Express.js + JWT |
| لوحة التحكم | React 18 + Vite (بدون Tailwind — CSS مخصص) |

## البنية

```
src/
  bot/        ← منطق بوت تيليجرام (handlers, keyboards, conversations)
  api/        ← Express API للوحة التحكم
  db/         ← Drizzle schema + migrations + seed
  services/   ← منطق الأعمال المشترك بين البوت والـ API
dashboard/    ← لوحة تحكم React (SPA)
scripts/      ← PM2 config + سكريبت النسخ الاحتياطي
nginx/        ← إعداد Nginx كـ reverse proxy
```

## البدء السريع (تطوير محلي)

### 1. المتطلبات
- Node.js 20+
- بوت تيليجرام (احصل على `BOT_TOKEN` من [@BotFather](https://t.me/BotFather))
- معرّف تيليجرام الخاص بك كأدمن (احصل عليه من [@userinfobot](https://t.me/userinfobot))

### 2. التثبيت

```bash
# الباك إند
npm install

# لوحة التحكم
npm --prefix dashboard install
```

### 3. الإعدادات

انسخ `.env.example` إلى `.env` واملأ القيم:

```bash
cp .env.example .env
```

```env
BOT_TOKEN=...                       # من BotFather
ADMIN_TELEGRAM_IDS=123456789        # معرّفك على تيليجرام (يمكن أكثر من واحد مفصولين بفاصلة)
DATABASE_PATH=./data/bot.db
PORT=3000
JWT_SECRET=...                      # نص عشوائي طويل
ADMIN_USERNAME=admin                # يوزرنيم لوحة التحكم
ADMIN_PASSWORD=...                  # باسورد قوي للوحة التحكم
DASHBOARD_ORIGIN=http://localhost:5173
```

### 4. قاعدة البيانات

```bash
npm run db:generate   # توليد ملفات الـ migration من الـ schema
npm run db:migrate    # تطبيقها على قاعدة البيانات
npm run db:seed       # إنشاء حساب الأدمن + بيانات تجريبية (اختياري)
```

### 5. التشغيل في وضع التطوير

في نافذتين طرفيتين منفصلتين:

```bash
npm run dev        # يشغّل البوت + الـ API على المنفذ 3000
npm run dev:dash   # يشغّل لوحة التحكم على المنفذ 5173 (بها proxy تلقائي لـ /api)
```

افتح البوت على تيليجرام وابدأ بـ `/start`، وافتح `http://localhost:5173` للوحة التحكم.

## البناء والتشغيل في الإنتاج

```bash
npm run build   # يبني الباك إند (tsup) + لوحة التحكم (vite build)
npm run start   # يشغّل عبر PM2 (يقرأ scripts/ecosystem.config.js)
npm run logs    # لعرض اللوجات
npm run stop    # لإيقاف الخدمة
```

في الإنتاج، سيرفر Express نفسه (على `PORT`) يقدّم كلًا من الـ API وملفات لوحة التحكم المبنية من `dashboard/dist` — فلا حاجة لسيرفر منفصل للفرونت إند.

### Nginx

عدّل `your-domain.com` في `nginx/bot.conf` ثم فعّله:

```bash
sudo cp nginx/bot.conf /etc/nginx/sites-available/delivery-bot
sudo ln -s /etc/nginx/sites-available/delivery-bot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

استخدم `certbot` لإضافة HTTPS بعد ذلك.

### النسخ الاحتياطي

```bash
npm run backup   # أو أضفه في crontab للتشغيل يوميًا
```

يحتفظ السكريبت بآخر 30 نسخة تلقائيًا في `/backups/delivery-bot` (قابل للتغيير عبر `BACKUP_DIR`).

## استخدام البوت

- **العملاء:** `/start` لعرض القائمة الرئيسية — تصفح المنتجات، بحث، عرض الطلبات السابقة.
- **الأدمن** (لمن كان معرّفه ضمن `ADMIN_TELEGRAM_IDS`): `/admin` لفتح لوحة التحكم داخل تيليجرام — إضافة منتج، استيراد بالجملة، رسالة جماعية، عرض المخزون والإحصائيات.

جميع عمليات إدارة الأقسام والمنتجات والمستخدمين والتسليمات بالتفصيل متاحة أيضًا (وبشكل أكمل) من خلال لوحة التحكم على الويب.

## ملاحظات تقنية مهمة

- **تسليم آمن من التكرار:** عند الضغط على "استلام المنتج"، يتم الاستيلاء على المنتج عبر `UPDATE` شرطي ذري (`isDelivered = false`) بحيث لا يمكن لمستخدمين اثنين الحصول على نفس المنتج حتى مع الضغط في نفس اللحظة.
- **الملفات:** لا يتم تخزين أي ملفات على القرص — يُستخدم `file_id` الخاص بتيليجرام، ويُحفظ في عمود `content` بنفس طريقة الكود/الرابط.
- **الحسابات (`content_type = account`):** هذا القالب يدعم تسليم بيانات دخول (يوزر:باسورد) كنوع محتوى عام لأي غرض تحدده أنت. تأكد أن ما تبيعه متوافق مع شروط خدمة أي طرف ثالث ومع القوانين المعمول بها — هذا يقع ضمن مسؤوليتك كمشغّل للبوت وليس جزءًا من هذا الكود.
- **الأمان:** كلمة مرور الأدمن مشفّرة بـ bcrypt (12 rounds)، الـ JWT صالح 24 ساعة، ومحاولات تسجيل الدخول محدودة (5 محاولات/دقيقة).
