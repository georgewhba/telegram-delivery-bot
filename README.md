<div align="center">
  <h1>🤖 Telegram Delivery Bot</h1>
  <p><strong>A fully automated Telegram bot for selling and delivering digital products (Keys, Files, Links, Accounts) with a built-in React Web Dashboard.</strong></p>
</div>

<hr />

## 📖 نظرة عامة (Overview)

بوت تيليجرام متكامل لبيع وتسليم المنتجات الرقمية تلقائياً. يحتوي على لوحة تحكم ويب شاملة لإدارة المنتجات، الأقسام، الإحصائيات، ومراقبة المخزون بسهولة تامة، بالإضافة إلى واجهة إدارة مصغرة داخل تيليجرام نفسه.

## ✨ المميزات (Features)

- **تسليم فوري وآمن:** نظام ذكي لمنع التكرار (Atomic Updates) يضمن عدم تسليم نفس المنتج لشخصين في نفس الوقت.
- **لوحة تحكم ويب:** واجهة حديثة وسريعة (React 18 + Vite) لإدارة كل شيء.
- **إدارة من داخل تيليجرام:** واجهة (Admin Panel) داخل البوت لإضافة المنتجات، إرسال رسائل جماعية، والاطلاع على المخزون.
- **أنواع منتجات متعددة:** يدعم تسليم الأكواد، الروابط، الحسابات، وحتى الملفات (عبر `file_id` الخاص بتيليجرام بدون استهلاك مساحة التخزين).
- **إحصائيات دقيقة:** تتبع المبيعات، المنتجات المتبقية، وعدد المستخدمين.

## 🛠 التقنيات المستخدمة (Tech Stack)

- **البوت:** [grammy.dev](https://grammy.dev)
- **واجهة الويب (Dashboard):** React 18, Vite
- **الخادم (Backend):** Node.js, Express.js
- **قاعدة البيانات:** SQLite (via `better-sqlite3`), Drizzle ORM

---

## 🚀 طريقة التشغيل (Getting Started)

### 1. المتطلبات (Requirements)
- Node.js 20+
- توكن البوت `BOT_TOKEN` من [@BotFather](https://t.me/BotFather)
- المعرّف الخاص بك `ADMIN_TELEGRAM_IDS` من [@userinfobot](https://t.me/userinfobot)

### 2. التثبيت (Installation)
قم بنسخ المشروع وتثبيت الحزم المطلوبة:
```bash
# تثبيت حزم البوت والخادم
npm install

# تثبيت حزم لوحة التحكم
npm --prefix dashboard install
```

### 3. الإعدادات (Configuration)
انسخ ملف `.env.example` إلى `.env` وقم بتعديل القيم بداخله لتناسب إعداداتك:
```bash
cp .env.example .env
```

مثال لمحتوى ملف `.env`:
```env
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_IDS=123456789
DATABASE_PATH=./data/bot.db
PORT=3000
JWT_SECRET=a_very_long_random_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong_password
DASHBOARD_ORIGIN=http://localhost:5173
```

### 4. تجهيز قاعدة البيانات (Database Setup)
```bash
npm run db:generate   # إنشاء ملفات التهيئة (Migrations)
npm run db:migrate    # تطبيق التهيئة على قاعدة البيانات
npm run db:seed       # إضافة الحساب الأساسي للمشرف (اختياري)
```

### 5. التشغيل (Run)
لتشغيل المشروع في بيئة التطوير المحلية (نافذتين منفصلتين):
```bash
# Terminal 1: تشغيل البوت وواجهة الـ API
npm run dev

# Terminal 2: تشغيل لوحة التحكم
npm run dev:dash
```
يمكنك الآن زيارة لوحة التحكم عبر [http://localhost:5173](http://localhost:5173).

---

## 🔒 ملاحظات الأمان (Security)
- لا تشارك ملف `.env` أبداً.
- تأكد من تغيير `JWT_SECRET` و `ADMIN_PASSWORD` قبل رفع المشروع للإنتاج.
- يتم تخزين كلمات المرور بشكل مشفر باستخدام (bcrypt).

## 📄 الترخيص (License)
هذا المشروع مفتوح المصدر ومتاح للاستخدام والتعديل.
