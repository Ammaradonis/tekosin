import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  de: {
    translation: {
      app: { title: 'TÊKOȘÎN Admin', subtitle: 'Verein für LGBTIQ-Geflüchtete und Migrant*innen in Wien' },
      nav: { dashboard: 'Dashboard', members: 'Mitglieder', payments: 'Zahlungen', events: 'Veranstaltungen', content: 'Inhalte', users: 'Benutzer', volunteers: 'Freiwillige', notifications: 'Benachrichtigungen', reports: 'Berichte', audit: 'Audit-Log', newsletters: 'Newsletter', settings: 'Einstellungen', exports: 'Exporte' },
      auth: { login: 'Anmelden', logout: 'Abmelden', email: 'E-Mail', password: 'Passwort', register: 'Registrieren', forgotPassword: 'Passwort vergessen?', welcomeBack: 'Willkommen zurück!', loginSubtitle: 'Melden Sie sich bei Ihrem Konto an' },
      dashboard: { title: 'Dashboard', totalMembers: 'Mitglieder gesamt', activeMembers: 'Aktive Mitglieder', pendingMembers: 'Ausstehend', monthlyRevenue: 'Monatsumsatz', upcomingEvents: 'Kommende Events', volunteers: 'Freiwillige', recentActivity: 'Letzte Aktivitäten', quickActions: 'Schnellaktionen' },
      members: { title: 'Mitgliederverwaltung', addNew: 'Neues Mitglied', search: 'Suchen...', firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail', phone: 'Telefon', nationality: 'Nationalität', status: 'Status', asylumStatus: 'Asylstatus', actions: 'Aktionen', edit: 'Bearbeiten', delete: 'Löschen', view: 'Ansehen', bulkActions: 'Massenaktionen', export: 'Exportieren', gdprForget: 'DSGVO: Daten löschen', gdprExport: 'DSGVO: Daten exportieren' },
      payments: { title: 'Zahlungsverwaltung', amount: 'Betrag', type: 'Typ', status: 'Status', donate: 'Spenden', refund: 'Rückerstattung', history: 'Verlauf', createOrder: 'Bestellung erstellen', oneTime: 'Einmalig', recurring: 'Wiederkehrend', subscription: 'Abonnement' },
      crisis: { urgent: 'DRINGEND: Leben stehen auf dem Spiel!', shocking: 'SCHOCKIERENDE REALITÄT: Handeln Sie jetzt, bevor es zu spät ist!', alert: 'KRISENALARM: Ihre Aktion rettet Leben!', timeRunning: 'Zeit läuft ab', daysLeft: 'Tage bis zum nächsten Krisenereignis!' },
      common: { save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten', create: 'Erstellen', search: 'Suchen', filter: 'Filtern', export: 'Exportieren', loading: 'Laden...', noData: 'Keine Daten', confirm: 'Bestätigen', back: 'Zurück', next: 'Weiter', active: 'Aktiv', inactive: 'Inaktiv', pending: 'Ausstehend', all: 'Alle' },
      footer: { madeWith: 'Made with passion by Anna & Muco', noHousing: 'Diese NGO bietet KEINE Unterkunft oder Rechtsberatung an.' },
      gdpr: { consent: 'DSGVO-Einwilligung', rightToForget: 'Recht auf Vergessenwerden', dataPortability: 'Datenübertragbarkeit', consentText: 'Ich stimme der Verarbeitung meiner Daten zu.' }
    }
  },
  en: {
    translation: {
      app: { title: 'TÊKOȘÎN Admin', subtitle: 'Association for LGBTIQ Refugees and Migrants in Vienna' },
      nav: { dashboard: 'Dashboard', members: 'Members', payments: 'Payments', events: 'Events', content: 'Content', users: 'Users', volunteers: 'Volunteers', notifications: 'Notifications', reports: 'Reports', audit: 'Audit Log', newsletters: 'Newsletters', settings: 'Settings', exports: 'Exports' },
      auth: { login: 'Login', logout: 'Logout', email: 'Email', password: 'Password', register: 'Register', forgotPassword: 'Forgot Password?', welcomeBack: 'Welcome Back!', loginSubtitle: 'Sign in to your account' },
      dashboard: { title: 'Dashboard', totalMembers: 'Total Members', activeMembers: 'Active Members', pendingMembers: 'Pending', monthlyRevenue: 'Monthly Revenue', upcomingEvents: 'Upcoming Events', volunteers: 'Volunteers', recentActivity: 'Recent Activity', quickActions: 'Quick Actions' },
      members: { title: 'Member Management', addNew: 'Add New Member', search: 'Search...', firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone', nationality: 'Nationality', status: 'Status', asylumStatus: 'Asylum Status', actions: 'Actions', edit: 'Edit', delete: 'Delete', view: 'View', bulkActions: 'Bulk Actions', export: 'Export', gdprForget: 'GDPR: Erase Data', gdprExport: 'GDPR: Export Data' },
      payments: { title: 'Payment Management', amount: 'Amount', type: 'Type', status: 'Status', donate: 'Donate', refund: 'Refund', history: 'History', createOrder: 'Create Order', oneTime: 'One-time', recurring: 'Recurring', subscription: 'Subscription' },
      crisis: { urgent: 'URGENT: Lives at Stake!', shocking: 'SHOCKING REALITY: Act Now Before It\'s Too Late!', alert: 'CRISIS ALERT: Your Action Saves Lives!', timeRunning: 'Time Running Out', daysLeft: 'Days Until Next Crisis Event!' },
      common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create', search: 'Search', filter: 'Filter', export: 'Export', loading: 'Loading...', noData: 'No Data', confirm: 'Confirm', back: 'Back', next: 'Next', active: 'Active', inactive: 'Inactive', pending: 'Pending', all: 'All' },
      footer: { madeWith: 'Made with passion by Anna & Muco', noHousing: 'This NGO does NOT offer housing or legal consultations.' },
      gdpr: { consent: 'GDPR Consent', rightToForget: 'Right to be Forgotten', dataPortability: 'Data Portability', consentText: 'I consent to the processing of my data.' }
    }
  },
  tr: {
    translation: {
      app: { title: 'TÊKOȘÎN Yönetim', subtitle: 'Viyana\'da LGBTİQ Mülteciler ve Göçmenler Derneği' },
      nav: { dashboard: 'Gösterge Paneli', members: 'Üyeler', payments: 'Ödemeler', events: 'Etkinlikler', content: 'İçerik', users: 'Kullanıcılar', volunteers: 'Gönüllüler', notifications: 'Bildirimler', reports: 'Raporlar', audit: 'Denetim Günlüğü', newsletters: 'Bültenler', settings: 'Ayarlar', exports: 'Dışa Aktarma' },
      auth: { login: 'Giriş', logout: 'Çıkış', email: 'E-posta', password: 'Şifre', register: 'Kayıt Ol', forgotPassword: 'Şifremi Unuttum?', welcomeBack: 'Tekrar Hoş Geldiniz!', loginSubtitle: 'Hesabınıza giriş yapın' },
      dashboard: { title: 'Gösterge Paneli', totalMembers: 'Toplam Üye', activeMembers: 'Aktif Üyeler', pendingMembers: 'Bekleyen', monthlyRevenue: 'Aylık Gelir', upcomingEvents: 'Yaklaşan Etkinlikler', volunteers: 'Gönüllüler', recentActivity: 'Son Aktiviteler', quickActions: 'Hızlı İşlemler' },
      members: { title: 'Üye Yönetimi', addNew: 'Yeni Üye Ekle', search: 'Ara...', firstName: 'Ad', lastName: 'Soyad', email: 'E-posta', phone: 'Telefon', nationality: 'Uyruk', status: 'Durum', asylumStatus: 'İltica Durumu', actions: 'İşlemler', edit: 'Düzenle', delete: 'Sil', view: 'Görüntüle', bulkActions: 'Toplu İşlemler', export: 'Dışa Aktar', gdprForget: 'KVKK: Verileri Sil', gdprExport: 'KVKK: Verileri Dışa Aktar' },
      payments: { title: 'Ödeme Yönetimi', amount: 'Tutar', type: 'Tür', status: 'Durum', donate: 'Bağış Yap', refund: 'İade', history: 'Geçmiş', createOrder: 'Sipariş Oluştur', oneTime: 'Tek Seferlik', recurring: 'Tekrarlayan', subscription: 'Abonelik' },
      crisis: { urgent: 'ACİL: Hayatlar Tehlikede!', shocking: 'ŞOK EDİCİ GERÇEK: Çok Geç Olmadan Harekete Geçin!', alert: 'KRİZ ALARMI: Eyleminiz Hayat Kurtarır!', timeRunning: 'Zaman Daralıyor', daysLeft: 'Gün Sonraki Kriz Olayına Kaldı!' },
      common: { save: 'Kaydet', cancel: 'İptal', delete: 'Sil', edit: 'Düzenle', create: 'Oluştur', search: 'Ara', filter: 'Filtrele', export: 'Dışa Aktar', loading: 'Yükleniyor...', noData: 'Veri Yok', confirm: 'Onayla', back: 'Geri', next: 'İleri', active: 'Aktif', inactive: 'Pasif', pending: 'Bekleyen', all: 'Tümü' },
      footer: { madeWith: 'Anna & Muco tarafından tutkuyla yapıldı', noHousing: 'Bu STK konut veya hukuki danışmanlık SUNMAMAKTADIR.' },
      gdpr: { consent: 'KVKK Onayı', rightToForget: 'Unutulma Hakkı', dataPortability: 'Veri Taşınabilirliği', consentText: 'Verilerimin işlenmesine onay veriyorum.' }
    }
  },
  ar: {
    translation: {
      app: { title: 'إدارة تيكوشين', subtitle: 'جمعية لاجئي ومهاجري مجتمع الميم في فيينا' },
      nav: { dashboard: 'لوحة القيادة', members: 'الأعضاء', payments: 'المدفوعات', events: 'الفعاليات', content: 'المحتوى', users: 'المستخدمون', volunteers: 'المتطوعون', notifications: 'الإشعارات', reports: 'التقارير', audit: 'سجل التدقيق', newsletters: 'النشرات', settings: 'الإعدادات', exports: 'التصدير' },
      auth: { login: 'تسجيل الدخول', logout: 'تسجيل الخروج', email: 'البريد الإلكتروني', password: 'كلمة المرور', register: 'التسجيل', forgotPassword: 'نسيت كلمة المرور؟', welcomeBack: 'مرحباً بعودتك!', loginSubtitle: 'سجل الدخول إلى حسابك' },
      dashboard: { title: 'لوحة القيادة', totalMembers: 'إجمالي الأعضاء', activeMembers: 'الأعضاء النشطون', pendingMembers: 'قيد الانتظار', monthlyRevenue: 'الإيرادات الشهرية', upcomingEvents: 'الفعاليات القادمة', volunteers: 'المتطوعون', recentActivity: 'النشاط الأخير', quickActions: 'إجراءات سريعة' },
      crisis: { urgent: 'عاجل: أرواح في خطر!', shocking: 'واقع صادم: تصرف الآن قبل فوات الأوان!', alert: 'تنبيه أزمة: عملك ينقذ الأرواح!', timeRunning: 'الوقت ينفد', daysLeft: 'أيام حتى حدث الأزمة القادم!' },
      common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', create: 'إنشاء', search: 'بحث', filter: 'تصفية', export: 'تصدير', loading: 'جاري التحميل...', noData: 'لا توجد بيانات', confirm: 'تأكيد', back: 'رجوع', next: 'التالي', active: 'نشط', inactive: 'غير نشط', pending: 'قيد الانتظار', all: 'الكل' },
      footer: { madeWith: 'صنع بشغف بواسطة آنا وموكو', noHousing: 'هذه المنظمة لا تقدم السكن أو الاستشارات القانونية.' },
      members: { title: 'إدارة الأعضاء', addNew: 'إضافة عضو جديد', search: 'بحث...', firstName: 'الاسم الأول', lastName: 'اسم العائلة' },
      payments: { title: 'إدارة المدفوعات', amount: 'المبلغ', donate: 'تبرع' }
    }
  },
  fa: {
    translation: {
      app: { title: 'مدیریت تکوشین', subtitle: 'انجمن پناهندگان و مهاجران دگرباشان جنسی در وین' },
      nav: { dashboard: 'داشبورد', members: 'اعضا', payments: 'پرداخت‌ها', events: 'رویدادها', content: 'محتوا', users: 'کاربران', volunteers: 'داوطلبان', notifications: 'اعلان‌ها', reports: 'گزارش‌ها', audit: 'گزارش حسابرسی', newsletters: 'خبرنامه‌ها', settings: 'تنظیمات', exports: 'صادرات' },
      auth: { login: 'ورود', logout: 'خروج', email: 'ایمیل', password: 'رمز عبور', register: 'ثبت نام', welcomeBack: 'خوش آمدید!', loginSubtitle: 'وارد حساب خود شوید' },
      crisis: { urgent: 'فوری: جان‌ها در خطر است!', shocking: 'واقعیت تکان‌دهنده: همین الان اقدام کنید!', alert: 'هشدار بحران: اقدام شما نجات‌بخش است!', timeRunning: 'زمان در حال اتمام', daysLeft: 'روز تا رویداد بحران بعدی!' },
      common: { save: 'ذخیره', cancel: 'لغو', delete: 'حذف', edit: 'ویرایش', create: 'ایجاد', search: 'جستجو', loading: 'در حال بارگذاری...', noData: 'داده‌ای نیست' },
      footer: { madeWith: 'ساخته شده با عشق توسط آنا و موکو', noHousing: 'این سازمان مسکن یا مشاوره حقوقی ارائه نمی‌دهد.' }
    }
  },
  es: {
    translation: {
      app: { title: 'TÊKOȘÎN Admin', subtitle: 'Asociación para Refugiados y Migrantes LGBTIQ en Viena' },
      nav: { dashboard: 'Panel', members: 'Miembros', payments: 'Pagos', events: 'Eventos', content: 'Contenido', users: 'Usuarios', volunteers: 'Voluntarios', notifications: 'Notificaciones', reports: 'Informes', audit: 'Registro de Auditoría', newsletters: 'Boletines', settings: 'Configuración', exports: 'Exportaciones' },
      auth: { login: 'Iniciar Sesión', logout: 'Cerrar Sesión', email: 'Correo', password: 'Contraseña', register: 'Registrarse', welcomeBack: '¡Bienvenido de vuelta!', loginSubtitle: 'Inicia sesión en tu cuenta' },
      crisis: { urgent: '¡URGENTE: Vidas en Juego!', shocking: '¡REALIDAD IMPACTANTE: Actúa Ahora!', alert: '¡ALERTA DE CRISIS: Tu Acción Salva Vidas!', timeRunning: 'El Tiempo se Agota', daysLeft: '¡Días Hasta el Próximo Evento de Crisis!' },
      common: { save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', create: 'Crear', search: 'Buscar', loading: 'Cargando...', noData: 'Sin Datos' },
      footer: { madeWith: 'Hecho con pasión por Anna y Muco', noHousing: 'Esta ONG NO ofrece alojamiento ni consultas legales.' }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
