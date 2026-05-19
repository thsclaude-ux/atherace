# إضافة أول مسؤول

1. في [Firebase Console](https://console.firebase.google.com) → Authentication → Add user (بريد + كلمة مرور).
2. انسخ **User UID** من صفحة المستخدم.
3. عيّن `BOOTSTRAP_SECRET` في Netlify وملف `.env` المحلي.
4. نفّذ:

```bash
curl -X POST "https://YOUR-SITE.netlify.app/.netlify/functions/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: YOUR_BOOTSTRAP_SECRET" \
  -d "{\"targetUid\": \"PASTE_FIREBASE_AUTH_UID\"}"
```

5. بعد نجاح الطلب، احذف `BOOTSTRAP_SECRET` من المتغيرات أو غيّره.

المسؤولون مخزّنون في `admins/{uid}` — التحقق يتم في كل دالة إدارية عبر `verify-admin.js`.

## الأدوار

| الدور | الحقل | الصلاحيات |
|--------|--------|-----------|
| مسؤول رئيسي | `"role": "admin"` (افتراضي) | قراءة وكتابة كاملة |
| قراءة فقط | `"role": "viewer"` | عرض البيانات فقط (لا حفظ نتائج، لا حذف، لا توليد أكواد) |

لإضافة مسؤول قراءة فقط، أرسل `role` في جسم الطلب:

```bash
curl -X POST "https://YOUR-SITE.netlify.app/.netlify/functions/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ID_TOKEN" \
  -d "{\"targetUid\": \"UID\", \"role\": \"viewer\"}"
```
