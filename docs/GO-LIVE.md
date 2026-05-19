# بوابة الإطلاق (Go-Live) — ترشيحات السباق

## 1. فحوصات آلية (محلياً)

```bash
npm install
npm test
npm run build
# مع .env مملوءاً كما على Netlify:
npm run check:deploy
```

## 2. فحص Staging

```bash
set SITE_URL=https://develop--YOUR-SITE.netlify.app
node scripts/smoke-remote.mjs
```

## 3. اختبار الحمل (على Staging فقط)

```bash
set LOAD_TEST_BASE_URL=https://develop--YOUR-SITE.netlify.app
set LOAD_TEST_DURATION=60
set LOAD_TEST_CONCURRENCY=25
npm run load-test
```

**معايير النجاح:**

| المؤشر | الحد |
|--------|------|
| أخطاء 5xx | &lt; 1% من الطلبات |
| زمن الاستجابة p95 | &lt; 2000 ms |

توقّع بعض طلبات `429` عند الضغط العالي — هذا سلوك مقصود (Rate limiting).

## 4. بوابة Go-Live الكاملة

```bash
# محلياً + بُعد (بعد ضبط .env و SITE_URL)
set SITE_URL=https://YOUR-PROD.netlify.app
npm run go-live
```

أو خطوة بخطوة:

```bash
npm test
npm run build
npm run check:deploy
npm run load-test
node scripts/go-live-check.mjs
```

## 5. النشر

```bash
npm run deploy
```

بعد النشر:

```bash
set SITE_URL=https://YOUR-PROD.netlify.app
node scripts/smoke-remote.mjs
curl -s "%SITE_URL%/.netlify/functions/health"
```

## 6. ما بعد الإطلاق (أول ساعة)

- [ ] Health أخضر في UptimeRobot
- [ ] لا spikes في Sentry
- [ ] مسار مشارك حقيقي ناجح
- [ ] مسؤول يولّد كوداً ويراقب الترتيب

## 7. التراجع (Rollback)

1. Netlify → Deploys → **Rollback** لآخر نشر ناجح.
2. استعادة RTDB من `backups/rtdb_*.json` عبر Firebase Console (إن لزم).
3. إبلاغ الفريق وإيقاف الرابط العام مؤقتاً.

---

**جهة اتصال الطوارئ:** راجع قسم «جهات الاتصال» في [RUNBOOK.md](RUNBOOK.md).
