import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api, storeTokens, clearTokens, getStoredToken } from "@/lib/api";

type Lang = "en" | "ar";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.predict": "Predict",
    "nav.leaderboard": "Leaderboard",
    "nav.admin": "Admin",
    "hero.title": "AT THE RACE",
    "hero.subtitle": "The ultimate race prediction platform. Compete, predict, and climb the leaderboard.",
    "hero.cta.predict": "Make Predictions",
    "hero.cta.leaderboard": "View Leaderboard",
    "features.title": "Why AT THE RACE?",
    "features.speed": "Lightning Fast",
    "features.speed.desc": "Real-time leaderboard updates as results come in.",
    "features.secure": "Secure & Private",
    "features.secure.desc": "Enterprise-grade security with encrypted sessions.",
    "features.global": "Global Ready",
    "features.global.desc": "Multi-language support for Arabic and English.",
    "predict.title": "Race Predictions",
    "predict.code": "Access Code",
    "predict.validate": "Validate Code",
    "predict.name": "Your Name",
    "predict.phone": "Phone (optional)",
    "predict.round": "Round",
    "predict.submit": "Submit Predictions",
    "predict.consent": "I agree to the privacy policy",
    "predict.success": "Predictions submitted successfully!",
    "leaderboard.title": "Live Leaderboard",
    "leaderboard.rank": "Rank",
    "leaderboard.name": "Name",
    "leaderboard.score": "Score",
    "admin.login": "Admin Login",
    "admin.email": "Email",
    "admin.password": "Password",
    "admin.dashboard": "Dashboard",
    "admin.codes": "Access Codes",
    "admin.winners": "Race Results",
    "admin.participants": "Participants",
    "admin.export": "Export",
    "admin.generate": "Generate Code",
    "admin.save": "Save Results",
    "admin.logout": "Logout",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.predict": "توقعات",
    "nav.leaderboard": "الترتيب",
    "nav.admin": "المسؤول",
    "hero.title": "AT THE RACE",
    "hero.subtitle": "منصة التوقعات الاحترافية. تنافس، توقع، وتصعد في الترتيب.",
    "hero.cta.predict": "قدّم توقعاتك",
    "hero.cta.leaderboard": "عرض الترتيب",
    "features.title": "لماذا AT THE RACE؟",
    "features.speed": "سرعة فائقة",
    "features.speed.desc": "تحديثات فورية للترتيب مع إعلان النتائج.",
    "features.secure": "آمن وخاص",
    "features.secure.desc": "أمان على مستوى المؤسسات مع جلسات مشفرة.",
    "features.global": "جاهز عالمياً",
    "features.global.desc": "دعم متعدد اللغات للعربية والإنجليزية.",
    "predict.title": "توقعات السباق",
    "predict.code": "كود الدخول",
    "predict.validate": "تحقق من الكود",
    "predict.name": "اسمك",
    "predict.phone": "الهاتف (اختياري)",
    "predict.round": "الشوط",
    "predict.submit": "إرسال التوقعات",
    "predict.consent": "أوافق على سياسة الخصوصية",
    "predict.success": "تم إرسال توقعاتك بنجاح!",
    "leaderboard.title": "الترتيب المباشر",
    "leaderboard.rank": "الترتيب",
    "leaderboard.name": "الاسم",
    "leaderboard.score": "النقاط",
    "admin.login": "دخول المسؤول",
    "admin.email": "البريد",
    "admin.password": "كلمة المرور",
    "admin.dashboard": "لوحة التحكم",
    "admin.codes": "أكواد الدخول",
    "admin.winners": "نتائج السباق",
    "admin.participants": "المشاركون",
    "admin.export": "تصدير",
    "admin.generate": "إنشاء كود",
    "admin.save": "حفظ النتائج",
    "admin.logout": "خروج",
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("atr_lang") as Lang) || "en");

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("atr_lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  const t = useCallback((key: string) => translations[lang][key] || key, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken());

  const login = async (email: string, password: string) => {
    const data = await api<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setToken(data.tokens.accessToken);
  };

  const logout = () => {
    clearTokens();
    setToken(null);
  };

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
