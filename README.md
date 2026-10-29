# TG V2Ray Exporter

سامانه‌ی مدرن، منعطف و بدون نیاز به API Key برای استخراج کانفیگ‌های V2Ray از کانال‌های عمومی تلگرام و ساخت سابسکرایب زنده مبتنی بر **Next.js** و **TypeScript**.

---

## ✨ امکانات و قابلیت‌ها

- **استخراج بدون نیاز به API تلگرام**: پایش و خزش کانال‌های عمومی از طریق وب‌پریویو رسمی (`t.me/s/:channel`) همراه با صفحه‌بندی خودکار تا N پیام اخیر.
- **پشتیبانی کامل از پروتکل‌های ارتباطی**:
  - `vmess://` (همراه با دیکد Base64 و متادیتا)
  - `vless://`
  - `trojan://`
  - `ss://` / `ssr://` (Shadowsocks و ShadowsocksR)
  - `hy2://` / `hysteria2://`
  - `tuic://`
  - `wireguard://`
  - استخراج خودکار از بلوک‌های متنی کُدگذاری‌شده (Base64)
- **شخصی‌سازی پیشرفته (Full Customization)**:
  - فیلتر بر اساس پروتکل‌های دلخواه
  - حذف هوشمند کانفیگ‌های تکراری بر پایه هش سرور، پورت و هویت کاربر
  - قالب‌بندی و تغییر نام دلخواه کانفیگ‌ها (Remark Template) با متغیرهای `{channel}`, `{protocol}`, `{index}`, `{server}`, `{port}`
- **خروجی منعطف و بدون نیاز به هیچ کلیدی**:
  - **لینک سابسکرایب زنده (Live Subscription)**: اندپوینت اختصاصی `/api/sub/:channel` با قابلیت اضافه شدن به عنوان سابسکرایب مستقیم در نرم‌افزارهای v2rayNG, V2RayN, Streisand, Sing-box
  - دانلود مستقیم فایل متنی `.txt`
  - کپی تکی یا دسته‌جمعی به صورت متنی یا Base64
  - ذخیره‌سازی محلی کانال‌ها و وضعیت در فایل JSON محلی
- **معماری ماژولار Storage Provider**:
  - `LocalFileStorageProvider` (فعال به صورت پیش‌فرض و آفلاین)
  - `GoogleDriveStorageProvider` (اسکلت آماده برای فعال‌سازی با وارد کردن متغیرهای محیطی در فاز بعدی)

---

## 🚀 راه‌اندازی و اجرا

### پیش‌نیازها
- Node.js نسخه 20 به بالا
- pnpm یا npm

### نصب وابستگی‌ها
```bash
pnpm install
# یا
npm install
```

### اجرای محیط توسعه
```bash
npm run dev
```
سپس مرورگر را باز کرده و به آدرس [http://localhost:3000](http://localhost:3000) مراجعه کنید.

### اجرای تست‌های خودکار
```bash
npm test
```

### بیلد برای پروداکشن
```bash
npm run build
npm start
```

---

## 📡 آدرس سابسکرایب زنده (Live Subscription)

پس از اجرای برنامه، می‌توانید آدرس زیر را مستقیماً به عنوان سابسکرایب در نرم‌افزارهای V2Ray اضافه کنید:

```text
http://localhost:3000/api/sub/<channel_username>
```

همچنین برای دریافت خروجی متنی خام (Plaintext) به جای Base64:
```text
http://localhost:3000/api/sub/<channel_username>?format=raw
```

---

## ☁️ اتصال به Google Drive (فاز بعدی)

برای ذخیره فایل‌های کانفیگ به صورت مستقیم در گوگل درایو، مقادیر زیر را در فایل `.env.local` تنظیم فرمایید:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id # اختیاری
```
