const STRINGS = {
  ar: {
    adminTitle: "لوحة المسؤول",
    participantTitle: "ترشيحات السباق",
    rankingTitle: "الترتيب والنتائج",
    login: "دخول",
    logout: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    tabWinners: "نتائج الأشواط",
    tabCodes: "توليد أكواد",
    tabManageCodes: "إدارة الأكواد",
    tabParticipants: "المشاركون",
    accessCode: "رمز الوصول",
    validateCode: "تحقق من الكود",
    submitBets: "إرسال ترشيحاتي",
    viewRanking: "عرض الترتيب",
    points: "النقاط",
    score: "النقاط",
    rank: "الترتيب",
    name: "الاسم",
    phone: "رقم الهاتف (اختياري)",
    optionalName: "الاسم (اختياري)",
    round: "الشوط",
    chooseHorse: "— اختر —",
    successSubmit: "تم حفظ ترشيحاتك بنجاح",
    alreadySubmitted: "تم التقديم مسبقاً",
    privacyConsent: "أوافق على",
    privacyLink: "سياسة الخصوصية",
    privacyRequired: "يجب الموافقة على سياسة الخصوصية",
    cancel: "إلغاء",
    dangerConfirm: "تأكيد الحذف",
    dangerTypeWord: "اكتب «{word}» للتأكيد:",
    clearAllTitle: "مسح جميع المشاركين",
    clearAllMessage:
      "سيُحذف جميع المشاركين والترشيحات والنتائج ويُعاد ضبط الأكواد. لا يمكن التراجع.",
    winnersSavedAt: "آخر حفظ للنتائج:",
    winnersNotSaved: "لم تُحفظ نتائج الأشواط بعد",
    privacyPageTitle: "سياسة الخصوصية",
    backToApp: "العودة للتطبيق",
    lang: "EN",
  },
  en: {
    adminTitle: "Admin Panel",
    participantTitle: "Race Predictions",
    rankingTitle: "Leaderboard",
    login: "Sign in",
    logout: "Sign out",
    email: "Email",
    password: "Password",
    tabWinners: "Round results",
    tabCodes: "Generate codes",
    tabManageCodes: "Manage codes",
    tabParticipants: "Participants",
    accessCode: "Access code",
    validateCode: "Validate code",
    submitBets: "Submit predictions",
    viewRanking: "View leaderboard",
    points: "Points",
    score: "Score",
    rank: "Rank",
    name: "Name",
    phone: "Phone (optional)",
    optionalName: "Name (optional)",
    round: "Round",
    chooseHorse: "— Select —",
    successSubmit: "Your predictions were saved",
    alreadySubmitted: "Already submitted",
    privacyConsent: "I agree to the",
    privacyLink: "Privacy Policy",
    privacyRequired: "You must accept the privacy policy",
    cancel: "Cancel",
    dangerConfirm: "Confirm delete",
    dangerTypeWord: 'Type "{word}" to confirm:',
    clearAllTitle: "Delete all participants",
    clearAllMessage:
      "All participants, predictions, scores, and code usage will be reset. This cannot be undone.",
    winnersSavedAt: "Results last saved:",
    winnersNotSaved: "Round results have not been saved yet",
    privacyPageTitle: "Privacy Policy",
    backToApp: "Back to app",
    lang: "ع",
  },
};

let lang = localStorage.getItem("atherace_lang") || "ar";

export function getLang() {
  return lang;
}

export function t(key, vars) {
  let text = STRINGS[lang][key] ?? STRINGS.ar[key] ?? key;
  if (vars && typeof text === "string") {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function setLang(next) {
  lang = next === "en" ? "en" : "ar";
  localStorage.setItem("atherace_lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function toggleLang() {
  setLang(lang === "ar" ? "en" : "ar");
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.placeholder = t(key);
  });
}

setLang(lang);
