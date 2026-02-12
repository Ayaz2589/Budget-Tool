import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RETURNING_USER_KEY,
  TOUR_COMPLETED_KEY,
  useGoogleAuth,
} from "@/context/GoogleAuthContext";
import i18n, { persistLocale } from "@/i18n";

type TourStep = {
  title: string;
  body: string;
  highlights: string[];
};

type TourCopy = {
  steps: TourStep[];
  signedInReplayBody: string;
  signedInReplayHighlights: string[];
  back: string;
  next: string;
  finishTour: string;
  signInWithGoogle: string;
};

const TOUR_COPY: Record<string, TourCopy> = {
  en: {
    steps: [
      {
        title: "Welcome to Ortho",
        body: "Ortho is built to give you one place to run your household finances without handing control of your data to a third-party backend.",
        highlights: [
          "Track expenses, income, debt, mortgage, and presets in one flow.",
          "Keep your records locally and decide when to sync or export.",
          "Use one consistent system across desktop and mobile.",
        ],
      },
      {
        title: "Google Sheets Sync",
        body: "Connect Google Sheets when you want spreadsheet visibility and backup-style copy of your data.",
        highlights: [
          "Sync writes your current app data to your chosen spreadsheet.",
          "Restore can pull your spreadsheet data back into the app.",
          "Auto-sync helps keep edits aligned with minimal manual work.",
        ],
      },
      {
        title: "Export Your Data",
        body: "You can move your data in and out of Ortho whenever needed.",
        highlights: [
          "Export and import with export string, PDF, and JSON.",
          "Portable formats let you migrate, archive, or inspect your data.",
          "No lock-in: you can always leave with your own records.",
        ],
      },
      {
        title: "Dashboard Overview",
        body: "The dashboard is your quick health check for the selected period.",
        highlights: [
          "See net cash flow, income, spending, and debt context at a glance.",
          "Use charts and owner views to spot trends quickly.",
          "Check insights and activity without digging through tables.",
        ],
      },
      {
        title: "Transactions and Income",
        body: "Use these pages for day-to-day entries and corrections.",
        highlights: [
          "Transactions: expenses, owner transfers, filters, and totals.",
          "Income: grouped history and fast add/edit workflows.",
          "Presets reduce repetitive entry work for common rows.",
        ],
      },
      {
        title: "Debt, Mortgage, and Settings",
        body: "Use these pages to manage obligations and app-level controls.",
        highlights: [
          "Debt and Mortgage track balances, payments, and history.",
          "Settings controls categories, owners, sync, formatting, and tour replay.",
          "Data page handles imports and exports.",
        ],
      },
      {
        title: "Language and Currency",
        body: "Ortho supports multi-language and multi-currency display so the app can match your preferences.",
        highlights: [
          "Switch app language from Settings at any time.",
          "Switch display currency and see values converted in the UI.",
          "Canonical storage remains consistent for reliable sync/export.",
        ],
      },
      {
        title: "Ready to Start",
        body: "Sign in with Google to begin using Ortho.",
        highlights: [
          "Sign in to unlock Google Sheets sync.",
          "You can replay this tour later from Settings.",
        ],
      },
    ],
    signedInReplayBody:
      "Your account is already connected. You can finish this walkthrough and continue to your dashboard.",
    signedInReplayHighlights: [
      "Google Sheets sync is available in Settings.",
      "You can replay this tour later from Settings.",
    ],
    back: "Back",
    next: "Next",
    finishTour: "Finish tour",
    signInWithGoogle: "Sign in with Google",
  },
  es: {
    steps: [
      {
        title: "Bienvenido a Ortho",
        body: "Ortho te da un solo lugar para gestionar tus finanzas del hogar sin ceder el control de tus datos a un backend de terceros.",
        highlights: [
          "Registra gastos, ingresos, deudas, hipoteca y presets en un solo flujo.",
          "Mantén tus datos localmente y decide cuándo sincronizar o exportar.",
          "Usa el mismo sistema en escritorio y móvil.",
        ],
      },
      {
        title: "Sincronización con Google Sheets",
        body: "Conecta Google Sheets cuando quieras visibilidad en hoja de cálculo y una copia de respaldo de tus datos.",
        highlights: [
          "Sincronizar escribe los datos actuales de la app en tu hoja elegida.",
          "Restaurar puede traer datos de la hoja de vuelta a la app.",
          "La autosincronización ayuda a mantener cambios alineados.",
        ],
      },
      {
        title: "Exporta tus datos",
        body: "Puedes mover tus datos dentro y fuera de Ortho cuando lo necesites.",
        highlights: [
          "Exporta e importa con cadena de exportación, PDF y JSON.",
          "Los formatos portables permiten migrar, archivar o inspeccionar datos.",
          "Sin bloqueo: siempre puedes salir con tus propios registros.",
        ],
      },
      {
        title: "Resumen del panel",
        body: "El panel es una revisión rápida del estado financiero del período seleccionado.",
        highlights: [
          "Ve flujo neto, ingresos, gastos y deuda de un vistazo.",
          "Usa gráficos y vistas por propietario para detectar tendencias.",
          "Revisa insights y actividad sin recorrer tablas.",
        ],
      },
      {
        title: "Transacciones e ingresos",
        body: "Usa estas páginas para entradas y correcciones del día a día.",
        highlights: [
          "Transacciones: gastos, transferencias entre propietarios, filtros y totales.",
          "Ingresos: historial agrupado y flujos rápidos de agregar/editar.",
          "Los presets reducen trabajo repetitivo.",
        ],
      },
      {
        title: "Deuda, hipoteca y configuración",
        body: "Usa estas páginas para gestionar obligaciones y controles de la app.",
        highlights: [
          "Deuda e hipoteca rastrean saldos, pagos e historial.",
          "Configuración controla categorías, propietarios, sync, formato y tour.",
          "La página de datos gestiona importación y exportación.",
        ],
      },
      {
        title: "Idioma y moneda",
        body: "Ortho soporta múltiples idiomas y monedas para ajustarse a tus preferencias.",
        highlights: [
          "Cambia el idioma en cualquier momento.",
          "Cambia moneda de visualización y ve valores convertidos.",
          "El almacenamiento canónico se mantiene consistente para sync/export.",
        ],
      },
      {
        title: "Listo para empezar",
        body: "Inicia sesión con Google para comenzar a usar Ortho.",
        highlights: [
          "Inicia sesión para habilitar sincronización con Google Sheets.",
          "Puedes repetir este tour desde Configuración.",
        ],
      },
    ],
    signedInReplayBody:
      "Tu cuenta ya está conectada. Puedes terminar este recorrido y continuar al panel.",
    signedInReplayHighlights: [
      "Google Sheets sync está disponible en Configuración.",
      "Puedes repetir este tour luego desde Configuración.",
    ],
    back: "Atrás",
    next: "Siguiente",
    finishTour: "Finalizar tour",
    signInWithGoogle: "Iniciar sesión con Google",
  },
  bn: {
    steps: [
      {
        title: "Ortho-তে স্বাগতম",
        body: "Ortho আপনার ঘরোয়া অর্থব্যবস্থা এক জায়গা থেকে পরিচালনা করতে সাহায্য করে, এবং ডেটার নিয়ন্ত্রণ আপনার কাছেই থাকে।",
        highlights: [
          "একই ফ্লোতে খরচ, আয়, ঋণ, মর্টগেজ ও প্রিসেট ট্র্যাক করুন।",
          "ডেটা লোকাল রাখুন, কখন সিঙ্ক/এক্সপোর্ট করবেন তা নিজে ঠিক করুন।",
          "ডেস্কটপ ও মোবাইলে একই সিস্টেম ব্যবহার করুন।",
        ],
      },
      {
        title: "Google Sheets সিঙ্ক",
        body: "স্প্রেডশিটে ডেটা দেখতে বা ব্যাকআপ কপি রাখতে চাইলে Google Sheets কানেক্ট করুন।",
        highlights: [
          "Sync আপনার বর্তমান অ্যাপ ডেটা নির্বাচিত শিটে লিখে দেয়।",
          "Restore শিটের ডেটা অ্যাপে ফিরিয়ে আনতে পারে।",
          "Auto-sync পরিবর্তনগুলো মিলিয়ে রাখতে সাহায্য করে।",
        ],
      },
      {
        title: "ডেটা এক্সপোর্ট",
        body: "প্রয়োজনে Ortho থেকে ডেটা সহজেই বাইরে নেওয়া বা ভেতরে আনা যায়।",
        highlights: [
          "Export string, PDF, এবং JSON দিয়ে export/import করুন।",
          "পোর্টেবল ফরম্যাটে migrate, archive বা inspect করা সহজ।",
          "লক-ইন নেই: আপনার ডেটা সবসময় আপনারই।",
        ],
      },
      {
        title: "ড্যাশবোর্ড ওভারভিউ",
        body: "নির্বাচিত সময়ের আর্থিক অবস্থা দ্রুত দেখার জন্য ড্যাশবোর্ড ব্যবহার করুন।",
        highlights: [
          "এক নজরে net cash flow, income, spend, debt দেখুন।",
          "চার্ট ও owner view দিয়ে ট্রেন্ড ধরুন।",
          "টেবিল ঘাঁটাঘাঁটি ছাড়াই insight ও activity দেখুন।",
        ],
      },
      {
        title: "লেনদেন ও আয়",
        body: "দৈনন্দিন এন্ট্রি ও সংশোধনের জন্য এই পেজগুলো ব্যবহার করুন।",
        highlights: [
          "Transactions: খরচ, owner transfer, filter, total।",
          "Income: grouped history ও দ্রুত add/edit।",
          "Preset দিয়ে পুনরাবৃত্ত এন্ট্রি কমান।",
        ],
      },
      {
        title: "ঋণ, মর্টগেজ ও সেটিংস",
        body: "দায়বদ্ধতা ও অ্যাপ-লেভেল কন্ট্রোল ম্যানেজ করতে এই পেজগুলো ব্যবহার করুন।",
        highlights: [
          "Debt ও Mortgage-এ balance, payment, history ট্র্যাক করুন।",
          "Settings থেকে category, owner, sync, format, tour replay নিয়ন্ত্রণ করুন।",
          "Data পেজে import/export ম্যানেজ করুন।",
        ],
      },
      {
        title: "ভাষা ও মুদ্রা",
        body: "Ortho একাধিক ভাষা ও মুদ্রা সাপোর্ট করে যাতে আপনার পছন্দমতো UI পান।",
        highlights: [
          "যেকোনো সময় অ্যাপ ভাষা বদলান।",
          "Display currency বদলালে UI-তে মান convert হয়ে দেখাবে।",
          "সিঙ্ক/এক্সপোর্ট নির্ভরযোগ্য রাখতে canonical storage একই থাকে।",
        ],
      },
      {
        title: "শুরু করতে প্রস্তুত",
        body: "Ortho ব্যবহার শুরু করতে Google দিয়ে সাইন ইন করুন।",
        highlights: [
          "Google Sheets sync চালু করতে সাইন ইন করুন।",
          "পরে Settings থেকে এই tour আবার চালাতে পারবেন।",
        ],
      },
    ],
    signedInReplayBody:
      "আপনার অ্যাকাউন্ট ইতিমধ্যে কানেক্টেড। এই walkthrough শেষ করে ড্যাশবোর্ডে যেতে পারেন।",
    signedInReplayHighlights: [
      "Settings-এ Google Sheets sync পাওয়া যাবে।",
      "পরে Settings থেকে tour আবার চালাতে পারবেন।",
    ],
    back: "পেছনে",
    next: "পরবর্তী",
    finishTour: "ট্যুর শেষ করুন",
    signInWithGoogle: "Google দিয়ে সাইন ইন",
  },
  zh: {
    steps: [
      {
        title: "欢迎使用 Ortho",
        body: "Ortho 让你在一个地方管理家庭财务，同时数据控制权始终在你手里。",
        highlights: [
          "在同一流程中管理支出、收入、债务、房贷和预设。",
          "数据本地保存，由你决定何时同步或导出。",
          "桌面端与移动端体验一致。",
        ],
      },
      {
        title: "Google Sheets 同步",
        body: "当你需要表格可视化和备份副本时，可连接 Google Sheets。",
        highlights: [
          "同步会把当前应用数据写入你选择的表格。",
          "恢复可将表格数据拉回应用。",
          "自动同步可减少手动对齐工作。",
        ],
      },
      {
        title: "导出你的数据",
        body: "你可以随时把数据导入或导出 Ortho。",
        highlights: [
          "支持导出字符串、PDF、JSON 的导入导出。",
          "可移植格式便于迁移、归档和审计。",
          "无锁定：你始终拥有自己的记录。",
        ],
      },
      {
        title: "仪表盘概览",
        body: "仪表盘用于快速查看当前周期的财务健康状态。",
        highlights: [
          "一眼看到净现金流、收入、支出与债务。",
          "通过图表和所有者视角快速识别趋势。",
          "无需深挖表格也能查看洞察与活动。",
        ],
      },
      {
        title: "交易与收入",
        body: "这些页面用于日常记账与修正。",
        highlights: [
          "交易页：支出、所有者转账、筛选与汇总。",
          "收入页：按月分组历史与快速增删改。",
          "预设可减少重复录入工作。",
        ],
      },
      {
        title: "债务、房贷与设置",
        body: "这些页面用于管理负债与应用级控制。",
        highlights: [
          "债务与房贷页面可跟踪余额、付款和历史。",
          "设置页控制分类、所有者、同步、格式和重播导览。",
          "数据页用于导入与导出。",
        ],
      },
      {
        title: "语言与货币",
        body: "Ortho 支持多语言和多币种显示，以匹配你的偏好。",
        highlights: [
          "可随时切换应用语言。",
          "可切换显示货币并查看转换后的数值。",
          "规范存储保持一致，确保同步/导出可靠。",
        ],
      },
      {
        title: "准备开始",
        body: "使用 Google 登录开始使用 Ortho。",
        highlights: [
          "登录后可启用 Google Sheets 同步。",
          "你可在设置中随时重播本导览。",
        ],
      },
    ],
    signedInReplayBody: "你的账号已连接。你可以完成本导览并继续进入仪表盘。",
    signedInReplayHighlights: [
      "可在设置中使用 Google Sheets 同步。",
      "可在设置中重播本导览。",
    ],
    back: "返回",
    next: "下一步",
    finishTour: "完成导览",
    signInWithGoogle: "使用 Google 登录",
  },
  ko: {
    steps: [
      {
        title: "Ortho에 오신 것을 환영합니다",
        body: "Ortho는 가계 재정을 한 곳에서 관리하면서도 데이터 통제권을 사용자에게 유지하도록 설계되었습니다.",
        highlights: [
          "지출, 수입, 부채, 모기지, 프리셋을 한 흐름에서 관리합니다.",
          "데이터를 로컬에 보관하고 동기화/내보내기 시점을 직접 결정합니다.",
          "데스크톱과 모바일에서 일관된 경험을 제공합니다.",
        ],
      },
      {
        title: "Google Sheets 동기화",
        body: "스프레드시트 가시성과 백업 복사본이 필요할 때 Google Sheets를 연결하세요.",
        highlights: [
          "동기화는 현재 앱 데이터를 선택한 시트에 기록합니다.",
          "복원은 시트 데이터를 앱으로 가져옵니다.",
          "자동 동기화로 수동 정렬 작업을 줄일 수 있습니다.",
        ],
      },
      {
        title: "데이터 내보내기",
        body: "필요할 때 언제든지 Ortho 데이터 입출력이 가능합니다.",
        highlights: [
          "Export string, PDF, JSON으로 가져오기/내보내기를 지원합니다.",
          "이식 가능한 형식으로 마이그레이션/보관/검토가 쉽습니다.",
          "잠금 없음: 데이터는 항상 사용자 소유입니다.",
        ],
      },
      {
        title: "대시보드 개요",
        body: "대시보드는 선택한 기간의 재무 상태를 빠르게 확인하는 화면입니다.",
        highlights: [
          "순현금흐름, 수입, 지출, 부채를 한눈에 확인합니다.",
          "차트와 소유자 뷰로 추세를 빠르게 파악합니다.",
          "표를 깊게 보지 않아도 인사이트와 활동을 확인합니다.",
        ],
      },
      {
        title: "거래 및 수입",
        body: "일상 입력과 수정은 이 페이지에서 처리합니다.",
        highlights: [
          "거래: 지출, 소유자 이체, 필터, 합계.",
          "수입: 월별 그룹 이력과 빠른 추가/수정.",
          "프리셋으로 반복 입력을 줄입니다.",
        ],
      },
      {
        title: "부채, 모기지, 설정",
        body: "의무 지출 관리와 앱 제어는 이 페이지들에서 처리합니다.",
        highlights: [
          "부채/모기지에서 잔액, 납부, 이력을 추적합니다.",
          "설정에서 카테고리, 소유자, 동기화, 형식, 투어 재실행을 제어합니다.",
          "데이터 페이지에서 가져오기/내보내기를 관리합니다.",
        ],
      },
      {
        title: "언어와 통화",
        body: "Ortho는 다국어와 다중 통화 표시를 지원합니다.",
        highlights: [
          "앱 언어를 언제든지 변경할 수 있습니다.",
          "표시 통화를 변경하면 UI 값이 환산되어 보입니다.",
          "신뢰할 수 있는 동기화/내보내기를 위해 기준 저장은 일관됩니다.",
        ],
      },
      {
        title: "시작할 준비",
        body: "Ortho를 시작하려면 Google로 로그인하세요.",
        highlights: [
          "Google Sheets 동기화를 사용하려면 로그인하세요.",
          "설정에서 이 투어를 다시 실행할 수 있습니다.",
        ],
      },
    ],
    signedInReplayBody: "이미 계정이 연결되어 있습니다. 투어를 마치고 대시보드로 이동하세요.",
    signedInReplayHighlights: [
      "Google Sheets 동기화는 설정에서 사용할 수 있습니다.",
      "설정에서 이 투어를 다시 실행할 수 있습니다.",
    ],
    back: "뒤로",
    next: "다음",
    finishTour: "투어 완료",
    signInWithGoogle: "Google로 로그인",
  },
  hi: {
    steps: [
      {
        title: "Ortho में आपका स्वागत है",
        body: "Ortho आपको घर की वित्तीय जानकारी एक जगह संभालने देता है, और डेटा का नियंत्रण आपके पास ही रहता है।",
        highlights: [
          "खर्च, आय, कर्ज, मॉर्गेज और प्रीसेट एक ही फ्लो में ट्रैक करें।",
          "रिकॉर्ड लोकल रखें और सिंक/एक्सपोर्ट का समय खुद तय करें।",
          "डेस्कटॉप और मोबाइल पर एक जैसा सिस्टम।",
        ],
      },
      {
        title: "Google Sheets सिंक",
        body: "स्प्रेडशीट विज़िबिलिटी और बैकअप कॉपी के लिए Google Sheets कनेक्ट करें।",
        highlights: [
          "Sync आपकी वर्तमान ऐप डेटा को चुनी हुई शीट में लिखता है।",
          "Restore शीट का डेटा वापस ऐप में ला सकता है।",
          "Auto-sync बदलावों को बिना ज्यादा manual काम के aligned रखता है।",
        ],
      },
      {
        title: "अपना डेटा एक्सपोर्ट करें",
        body: "ज़रूरत पड़ने पर आप Ortho में डेटा import/export कर सकते हैं।",
        highlights: [
          "Export string, PDF और JSON से import/export करें।",
          "Portable formats migration, archive और inspection में मदद करते हैं।",
          "No lock-in: आपका डेटा हमेशा आपका ही रहता है।",
        ],
      },
      {
        title: "डैशबोर्ड ओवरव्यू",
        body: "डैशबोर्ड चुने गए समय का quick financial health check देता है।",
        highlights: [
          "Net cash flow, income, spend और debt एक नज़र में देखें।",
          "Charts और owner views से trends जल्दी पकड़ें।",
          "टेबल में गहराई से जाए बिना insights देखें।",
        ],
      },
      {
        title: "Transactions और Income",
        body: "रोज़मर्रा की entries और corrections के लिए ये पेज उपयोग करें।",
        highlights: [
          "Transactions: खर्च, owner transfer, filters और totals।",
          "Income: grouped history और fast add/edit flow।",
          "Presets से repetitive entry कम होती है।",
        ],
      },
      {
        title: "Debt, Mortgage और Settings",
        body: "Obligations और app controls को manage करने के लिए ये पेज हैं।",
        highlights: [
          "Debt और Mortgage में balances, payments और history track करें।",
          "Settings में categories, owners, sync, format और tour replay नियंत्रित करें।",
          "Data page imports और exports संभालता है।",
        ],
      },
      {
        title: "भाषा और मुद्रा",
        body: "Ortho multi-language और multi-currency display support करता है।",
        highlights: [
          "App language कभी भी बदलें।",
          "Display currency बदलें और converted values देखें।",
          "Reliable sync/export के लिए canonical storage consistent रहता है।",
        ],
      },
      {
        title: "शुरू करने के लिए तैयार",
        body: "Ortho शुरू करने के लिए Google से साइन इन करें।",
        highlights: [
          "Google Sheets sync के लिए साइन इन करें।",
          "आप इस tour को बाद में Settings से replay कर सकते हैं।",
        ],
      },
    ],
    signedInReplayBody: "आपका अकाउंट पहले से connected है। यह walkthrough पूरा करके dashboard पर जाएँ।",
    signedInReplayHighlights: [
      "Google Sheets sync Settings में उपलब्ध है।",
      "आप इस tour को Settings से दोबारा चला सकते हैं।",
    ],
    back: "वापस",
    next: "आगे",
    finishTour: "टूर समाप्त करें",
    signInWithGoogle: "Google से साइन इन करें",
  },
  ja: {
    steps: [
      {
        title: "Orthoへようこそ",
        body: "Ortho は家計管理を1か所で行えるようにしつつ、データの主導権をユーザーに残します。",
        highlights: [
          "支出・収入・負債・住宅ローン・プリセットを一つの流れで管理。",
          "データはローカル保存、同期やエクスポート時期は自分で決定。",
          "デスクトップとモバイルで一貫した操作性。",
        ],
      },
      {
        title: "Google Sheets 同期",
        body: "表計算での可視化やバックアップが必要なときに Google Sheets を接続します。",
        highlights: [
          "同期で現在のアプリデータを選択したシートへ書き込み。",
          "復元でシートのデータをアプリへ取り込み。",
          "自動同期で手動調整を減らします。",
        ],
      },
      {
        title: "データのエクスポート",
        body: "必要に応じて Ortho のデータを入出力できます。",
        highlights: [
          "Export string / PDF / JSON でエクスポート・インポート。",
          "移行・保管・確認に使えるポータブル形式。",
          "ロックインなし。データは常にあなたのものです。",
        ],
      },
      {
        title: "ダッシュボード概要",
        body: "ダッシュボードは選択期間の財務状況を素早く確認する画面です。",
        highlights: [
          "純キャッシュフロー、収入、支出、負債を一目で確認。",
          "チャートと所有者ビューでトレンドを把握。",
          "表を深掘りせずにインサイトを確認。",
        ],
      },
      {
        title: "取引と収入",
        body: "日々の入力・修正はこのページで行います。",
        highlights: [
          "取引: 支出、所有者間振替、フィルター、合計。",
          "収入: 月別履歴と高速な追加/編集フロー。",
          "プリセットで繰り返し入力を削減。",
        ],
      },
      {
        title: "負債・住宅ローン・設定",
        body: "固定的な支払い管理とアプリ設定はこのページ群で行います。",
        highlights: [
          "負債と住宅ローンで残高・支払い・履歴を追跡。",
          "設定でカテゴリ・所有者・同期・表示形式・ツアー再生を制御。",
          "データページでインポート/エクスポートを管理。",
        ],
      },
      {
        title: "言語と通貨",
        body: "Ortho は多言語と多通貨表示に対応しています。",
        highlights: [
          "アプリ言語をいつでも変更可能。",
          "表示通貨を変更すると UI の値を換算表示。",
          "同期/出力の信頼性のため保存形式は一貫。",
        ],
      },
      {
        title: "開始準備完了",
        body: "Google でサインインして Ortho を開始してください。",
        highlights: [
          "Google Sheets 同期を使うにはサインインが必要です。",
          "このツアーは設定から再実行できます。",
        ],
      },
    ],
    signedInReplayBody:
      "アカウントはすでに接続されています。このウォークスルーを完了してダッシュボードへ進んでください。",
    signedInReplayHighlights: [
      "Google Sheets 同期は設定から利用できます。",
      "このツアーは設定から再実行できます。",
    ],
    back: "戻る",
    next: "次へ",
    finishTour: "ツアーを終了",
    signInWithGoogle: "Googleでサインイン",
  },
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "bn", label: "বাংলা" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "hi", label: "हिन्दी" },
  { value: "ja", label: "日本語" },
] as const;

function setTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, "1");
    localStorage.setItem(RETURNING_USER_KEY, "1");
  } catch {
    // ignore
  }
}

export function TourPage() {
  const { isSignedIn, signIn } = useGoogleAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [tourLocale, setTourLocale] = useState("en");
  const isReplay = searchParams.get("replay") === "1";
  const copy = TOUR_COPY[tourLocale] ?? TOUR_COPY.en;
  const steps = copy.steps;
  const totalSteps = steps.length + 1;
  const isLanguageStep = stepIndex === 0;
  const lastIndex = totalSteps - 1;
  const isLast = stepIndex === lastIndex;
  const contentStepIndex = Math.max(0, stepIndex - 1);
  const baseStep = steps[contentStepIndex]!;
  const step =
    isLast && isSignedIn
      ? {
          ...baseStep,
          body: copy.signedInReplayBody,
          highlights: copy.signedInReplayHighlights,
        }
      : baseStep;
  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${totalSteps}`,
    [stepIndex, totalSteps],
  );

  useEffect(() => {
    i18n.changeLanguage("en");
    persistLocale("en");
  }, []);

  if (isSignedIn && !isReplay) {
    return <Navigate to="/dashboard" replace />;
  }

  const goBack = () => setStepIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setStepIndex((prev) => Math.min(lastIndex, prev + 1));
  const handleLanguageChange = (locale: string) => {
    setTourLocale(locale);
    i18n.changeLanguage(locale);
    persistLocale(locale);
  };

  const handleFinishSignIn = () => {
    setTourCompleted();
    signIn();
  };

  const handleFinishReplay = () => {
    setTourCompleted();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-4">
        {isLanguageStep && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{i18n.t("common.language")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {i18n.t("common.languageTourIntro")}
              </p>
              <Select value={tourLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end">
                <Button type="button" onClick={goNext}>
                  {copy.next}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {!isLanguageStep && (
          <Card>
            <CardHeader className="space-y-2">
              <div className="text-sm text-muted-foreground">{progressLabel}</div>
              <CardTitle className="text-2xl">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <p className="text-base text-muted-foreground leading-relaxed">
                {step.body}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {step.highlights.map((item) => (
                  <li key={item} className="leading-relaxed">
                    - {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={goBack}>
                  {copy.back}
                </Button>
                {!isLast ? (
                  <Button type="button" onClick={goNext}>
                    {copy.next}
                  </Button>
                ) : isSignedIn ? (
                  <Button type="button" onClick={handleFinishReplay}>
                    {copy.finishTour}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleFinishSignIn}>
                    {copy.signInWithGoogle}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
