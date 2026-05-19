# دليل التشغيل — ترشيحات السباق

## البيئات

| البيئة | Netlify | Firebase | `APP_ENV` |
|--------|---------|----------|-----------|
| **إنتاج** | `main` → Production | مشروع prod | `production` |
| **Staging** | فرع `develop` → Branch deploy | مشروع staging (موصى به) | `staging` |
| **Preview** | Pull Request | نفس staging أو prod معزول | `preview` |

### إعداد Staging على Netlify

1. **Site configuration → Build & deploy → Continuous deployment**
   - Branch deploys: **Deploy only `develop`** (أو All).
2. **Environment variables** — أنشئ نطاقين:
   - **Production**: متغيرات مشروع Firebase الإنتاج + `ALLOWED_ORIGIN=https://your-prod.netlify.app`
   - **Branch deploys** / **Deploy previews**: مشروع Firebase staging + `ALLOWED_ORIGIN` لرابط staging
3. عيّن `APP_ENV=staging` لنطاق Branch deploys و`APP_ENV=production` للإنتاج.

رابط Staging النموذجي: `https://develop--your-site.netlify.app`

---

## المراقبة

### Health check

```http
GET https://YOUR-SITE.netlify.app/.netlify/functions/health
```

استجابة سليمة: `200` و `"ok": true`.

**UptimeRobot / Better Stack:** فحص كل 5 دقائق، تنبيه عند `503` أو timeout.

### Sentry (أخطاء الدوال)

1. أنشئ مشروع Node في [sentry.io](https://sentry.io).
2. أضف في Netlify: `SENTRY_DSN=https://...@sentry.io/...`
3. اختياري: `SENTRY_TRACES_SAMPLE_RATE=0.1` للأداء.

يوم الحدث: راقب Issues في Sentry + **Netlify → Functions → Logs**.

### Firebase Console

- **Usage** لـ RTDB (قراءات/كتابات).
- **Authentication** لمحاولات دخول فاشلة.

---

## النسخ الاحتياطي

### قبل الحدث (إلزامي)

```bash
# من جذر المشروع مع .env مملوء
npm run backup:rtdb
```

يُنشئ `backups/rtdb_YYYYMMDD_HHMMSS.json` (غير مرفوع إلى Git).

### تصدير Excel (مسؤول)

من لوحة المسؤول → تصدير المشاركين، أو استدعاء `exportParticipants`.

### استعادة يدوية (طوارئ)

1. أوقف وصول المشاركين مؤقتاً (أو غيّر DNS).
2. Firebase Console → Realtime Database → استيراد JSON (بحذر — يستبدل البيانات).
3. أو استعد مسارات محددة من ملف النسخة عبر Console / سكربت مخصص.

---

## حوادث شائعة

| العرض | السبب المحتمل | الإجراء |
|-------|----------------|---------|
| 500 على كل API | `FIREBASE_*` ناقصة | Netlify env vars |
| المسؤول لا يسجل دخول | `firebase-config` | `npm run build` + `FIREBASE_WEB_*` |
| 403 على submit | جلسة منتهية | إعادة التحقق من الكود |
| 429 للمشاركين | Rate limit | انتظر أو راجع `_rate_limits` في RTDB |
| CORS في المتصفح | `ALLOWED_ORIGIN` خاطئ | طابق نطاق الموقع بالضبط |

### مسح المشاركين

لوحة المسؤول → «مسح الكل» → اكتب **حذف** في نافذة التأكيد. **شغّل `npm run backup:rtdb` أولاً.**

### خصوصية المشاركين

- السياسة: `/privacy.html` — حدّث البريد في الصفحة قبل الإنتاج.
- `PRIVACY_POLICY_VERSION` في Netlify عند تحديث السياسة.

### تغيير نتائج الفائزين

`saveWinners` يعيد حساب النقاط لجميع `user_bets` الحالية.

---

## اختبار الحمل

```bash
LOAD_TEST_BASE_URL=https://staging.netlify.app LOAD_TEST_DURATION=60 npm run load-test
```

الهدف: أقل من 1% أخطاء 5xx، وp95 أقل من 2 ثانية. راجع [GO-LIVE.md](GO-LIVE.md).

## قائمة يوم الحدث

- [ ] Health check أخضر
- [ ] نسخة RTDB (`npm run backup:rtdb`)
- [ ] Sentry بدون spikes غير طبيعية
- [ ] مسؤول مسجّل + إنشاء كود تجريبي
- [ ] مسار مشارك: كود → ترشيح → ترتيب
- [ ] جهة اتصال تقنية متاحة

---

## جهات الاتصال

| الدور | الاسم | التواصل |
|-------|-------|---------|
| تقنية | __________ | __________ |
| تشغيل الفعالية | __________ | __________ |
