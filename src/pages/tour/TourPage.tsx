import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
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
} from "@/context";
import i18n, { persistLocale } from "@/i18n";
import { storage } from "@/lib/storage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { X } from "lucide-react";

type TourStep = {
  title: string;
  body: string;
  highlights: string[];
  simplifiedBody: string;
  simplifiedHighlights: string[];
};

type TourCopy = {
  steps: TourStep[];
  signedInReplayBody: string;
  signedInReplayHighlights: string[];
  signedInSimplifiedReplayBody: string;
  signedInSimplifiedReplayHighlights: string[];
  languageCardTitle: string;
  languageCardCta: string;
  back: string;
  next: string;
  finishTour: string;
  signInWithGoogle: string;
  toggleDetailed: string;
  toggleSimplified: string;
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
        simplifiedBody: "Ortho helps you manage your household money in one place.",
        simplifiedHighlights: [
          "Track spending, income, and debt together.",
          "Your data stays on your device.",
          "Works on desktop and mobile.",
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
        simplifiedBody: "Back up your data to Google Sheets.",
        simplifiedHighlights: [
          "Push data to a spreadsheet.",
          "Pull data back from a spreadsheet.",
          "Auto-sync keeps things in sync.",
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
        simplifiedBody: "Move your data in and out freely.",
        simplifiedHighlights: [
          "Export as PDF, JSON, or text.",
          "Import data back anytime.",
          "No lock-in.",
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
        simplifiedBody: "See your financial summary at a glance.",
        simplifiedHighlights: [
          "View income, spending, and cash flow.",
          "Charts show trends quickly.",
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
        simplifiedBody: "Add and edit your daily transactions here.",
        simplifiedHighlights: [
          "Log expenses and income.",
          "Use presets for repeated entries.",
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
        simplifiedBody: "Manage debts and app settings.",
        simplifiedHighlights: [
          "Track debt and mortgage payments.",
          "Adjust categories, owners, and sync.",
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
        simplifiedBody: "Change the app language and currency anytime.",
        simplifiedHighlights: [
          "Switch language in Settings.",
          "Switch display currency.",
        ],
      },
      {
        title: "Ready to Start",
        body: "Sign in with Google to begin using Ortho.",
        highlights: [
          "Sign in to unlock Google Sheets sync.",
          "You can replay this tour later from Settings.",
        ],
        simplifiedBody: "Sign in with Google to get started.",
        simplifiedHighlights: [
          "Enables Google Sheets sync.",
          "Replay this tour from Settings.",
        ],
      },
    ],
    signedInReplayBody:
      "Your account is already connected. You can finish this walkthrough and continue to your dashboard.",
    signedInReplayHighlights: [
      "Google Sheets sync is available in Settings.",
      "You can replay this tour later from Settings.",
    ],
    signedInSimplifiedReplayBody:
      "You're already signed in. Finish to go to your dashboard.",
    signedInSimplifiedReplayHighlights: [
      "Sheets sync is in Settings.",
      "Replay this tour from Settings.",
    ],
    languageCardTitle: "What language do you want to use Ortho?",
    languageCardCta: "Let's get Started",
    back: "Back",
    next: "Next",
    finishTour: "Finish tour",
    signInWithGoogle: "Sign in with Google",
    toggleDetailed: "Detailed",
    toggleSimplified: "Simple",
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
        simplifiedBody: "Ortho te ayuda a gestionar tu dinero en un solo lugar.",
        simplifiedHighlights: [
          "Registra gastos, ingresos y deudas juntos.",
          "Tus datos se quedan en tu dispositivo.",
          "Funciona en escritorio y móvil.",
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
        simplifiedBody: "Respalda tus datos en Google Sheets.",
        simplifiedHighlights: [
          "Envía datos a una hoja de cálculo.",
          "Recupera datos de la hoja.",
          "Auto-sync mantiene todo sincronizado.",
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
        simplifiedBody: "Mueve tus datos libremente.",
        simplifiedHighlights: [
          "Exporta como PDF, JSON o texto.",
          "Importa datos en cualquier momento.",
          "Sin restricciones.",
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
        simplifiedBody: "Ve tu resumen financiero de un vistazo.",
        simplifiedHighlights: [
          "Muestra ingresos, gastos y flujo de caja.",
          "Los gráficos muestran tendencias rápidamente.",
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
        simplifiedBody: "Agrega y edita tus transacciones diarias aquí.",
        simplifiedHighlights: [
          "Registra gastos e ingresos.",
          "Usa presets para entradas repetidas.",
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
        simplifiedBody: "Gestiona deudas y configuración de la app.",
        simplifiedHighlights: [
          "Rastrea pagos de deuda e hipoteca.",
          "Ajusta categorías, propietarios y sync.",
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
        simplifiedBody: "Cambia el idioma y la moneda en cualquier momento.",
        simplifiedHighlights: [
          "Cambia el idioma en Configuración.",
          "Cambia la moneda de visualización.",
        ],
      },
      {
        title: "Listo para empezar",
        body: "Inicia sesión con Google para comenzar a usar Ortho.",
        highlights: [
          "Inicia sesión para habilitar sincronización con Google Sheets.",
          "Puedes repetir este tour desde Configuración.",
        ],
        simplifiedBody: "Inicia sesión con Google para comenzar.",
        simplifiedHighlights: [
          "Activa sincronización con Google Sheets.",
          "Repite este tour desde Configuración.",
        ],
      },
    ],
    signedInReplayBody:
      "Tu cuenta ya está conectada. Puedes terminar este recorrido y continuar al panel.",
    signedInReplayHighlights: [
      "Google Sheets sync está disponible en Configuración.",
      "Puedes repetir este tour luego desde Configuración.",
    ],
    signedInSimplifiedReplayBody:
      "Ya tienes sesión iniciada. Finaliza para ir al panel.",
    signedInSimplifiedReplayHighlights: [
      "Sheets sync está en Configuración.",
      "Repite este tour desde Configuración.",
    ],
    languageCardTitle: "Que idioma quieres usar en Ortho?",
    languageCardCta: "Comencemos",
    back: "Atrás",
    next: "Siguiente",
    finishTour: "Finalizar tour",
    signInWithGoogle: "Iniciar sesión con Google",
    toggleDetailed: "Detallado",
    toggleSimplified: "Simple",
  },
  bn: {
    steps: [
      {
        title: "Ortho-তে স্বাগতম",
        body: "Ortho আপনার ঘরোয়া অর্থব্যবস্থা এক জায়গা থেকে পরিচালনা করতে সাহায্য করে, এবং ডেটার নিয়ন্ত্রণ আপনার কাছেই থাকে।",
        highlights: [
          "একই ফ্লোতে খরচ, আয়, ঋণ, মর্টগেজ ও প্রিসেট ট্র্যাক করুন।",
          "ডেটা লোকাল রাখুন, কখন সিঙ্ক/এক্সপোর্ট করবেন তা নিজে ঠিক করুন।",
          "ডেস্কটপ ও মোবাইলে একই সিস্টেম ব্যবহার করুন।",
        ],
        simplifiedBody: "Ortho আপনার ঘরের টাকা এক জায়গায় সামলাতে সাহায্য করে।",
        simplifiedHighlights: [
          "খরচ, আয় ও ঋণ একসাথে ট্র্যাক করুন।",
          "ডেটা আপনার ডিভাইসেই থাকে।",
          "ডেস্কটপ ও মোবাইলে কাজ করে।",
        ],
      },
      {
        title: "Google Sheets সিঙ্ক",
        body: "স্প্রেডশিটে ডেটা দেখতে বা ব্যাকআপ কপি রাখতে চাইলে Google Sheets কানেক্ট করুন।",
        highlights: [
          "Sync আপনার বর্তমান অ্যাপ ডেটা নির্বাচিত শিটে লিখে দেয়।",
          "Restore শিটের ডেটা অ্যাপে ফিরিয়ে আনতে পারে।",
          "Auto-sync পরিবর্তনগুলো মিলিয়ে রাখতে সাহায্য করে।",
        ],
        simplifiedBody: "Google Sheets-এ ডেটা ব্যাকআপ করুন।",
        simplifiedHighlights: [
          "শিটে ডেটা পাঠান।",
          "শিট থেকে ডেটা ফেরত আনুন।",
          "Auto-sync সব মিলিয়ে রাখে।",
        ],
      },
      {
        title: "ডেটা এক্সপোর্ট",
        body: "প্রয়োজনে Ortho থেকে ডেটা সহজেই বাইরে নেওয়া বা ভেতরে আনা যায়।",
        highlights: [
          "Export string, PDF, এবং JSON দিয়ে export/import করুন।",
          "পোর্টেবল ফরম্যাটে migrate, archive বা inspect করা সহজ।",
          "লক-ইন নেই: আপনার ডেটা সবসময় আপনারই।",
        ],
        simplifiedBody: "ডেটা অবাধে আনুন-নিন।",
        simplifiedHighlights: [
          "PDF, JSON বা টেক্সট হিসেবে এক্সপোর্ট।",
          "যেকোনো সময় ডেটা ইমপোর্ট।",
          "কোনো লক-ইন নেই।",
        ],
      },
      {
        title: "ড্যাশবোর্ড ওভারভিউ",
        body: "নির্বাচিত সময়ের আর্থিক অবস্থা দ্রুত দেখার জন্য ড্যাশবোর্ড ব্যবহার করুন।",
        highlights: [
          "এক নজরে net cash flow, income, spend, debt দেখুন।",
          "চার্ট ও owner view দিয়ে ট্রেন্ড ধরুন।",
          "টেবিল ঘাঁটাঘাঁটি ছাড়াই insight ও activity দেখুন।",
        ],
        simplifiedBody: "এক নজরে আর্থিক সারাংশ দেখুন।",
        simplifiedHighlights: [
          "আয়, খরচ ও ক্যাশ ফ্লো দেখুন।",
          "চার্ট দিয়ে দ্রুত ট্রেন্ড ধরুন।",
        ],
      },
      {
        title: "লেনদেন ও আয়",
        body: "দৈনন্দিন এন্ট্রি ও সংশোধনের জন্য এই পেজগুলো ব্যবহার করুন।",
        highlights: [
          "Transactions: খরচ, owner transfer, filter, total।",
          "Income: grouped history ও দ্রুত add/edit।",
          "Preset দিয়ে পুনরাবৃত্ত এন্ট্রি কমান।",
        ],
        simplifiedBody: "দৈনিক লেনদেন এখানে যোগ ও সম্পাদনা করুন।",
        simplifiedHighlights: [
          "খরচ ও আয় লিখুন।",
          "পুনরাবৃত্ত এন্ট্রির জন্য প্রিসেট ব্যবহার করুন।",
        ],
      },
      {
        title: "ঋণ, মর্টগেজ ও সেটিংস",
        body: "দায়বদ্ধতা ও অ্যাপ-লেভেল কন্ট্রোল ম্যানেজ করতে এই পেজগুলো ব্যবহার করুন।",
        highlights: [
          "Debt ও Mortgage-এ balance, payment, history ট্র্যাক করুন।",
          "Settings থেকে category, owner, sync, format, tour replay নিয়ন্ত্রণ করুন।",
          "Data পেজে import/export ম্যানেজ করুন।",
        ],
        simplifiedBody: "ঋণ ও অ্যাপ সেটিংস পরিচালনা করুন।",
        simplifiedHighlights: [
          "ঋণ ও মর্টগেজ পেমেন্ট ট্র্যাক করুন।",
          "ক্যাটেগরি, মালিক ও সিঙ্ক সামলান।",
        ],
      },
      {
        title: "ভাষা ও মুদ্রা",
        body: "Ortho একাধিক ভাষা ও মুদ্রা সাপোর্ট করে যাতে আপনার পছন্দমতো UI পান।",
        highlights: [
          "যেকোনো সময় অ্যাপ ভাষা বদলান।",
          "Display currency বদলালে UI-তে মান convert হয়ে দেখাবে।",
          "সিঙ্ক/এক্সপোর্ট নির্ভরযোগ্য রাখতে canonical storage একই থাকে।",
        ],
        simplifiedBody: "যেকোনো সময় ভাষা ও মুদ্রা বদলান।",
        simplifiedHighlights: [
          "Settings থেকে ভাষা বদলান।",
          "ডিসপ্লে মুদ্রা বদলান।",
        ],
      },
      {
        title: "শুরু করতে প্রস্তুত",
        body: "Ortho ব্যবহার শুরু করতে Google দিয়ে সাইন ইন করুন।",
        highlights: [
          "Google Sheets sync চালু করতে সাইন ইন করুন।",
          "পরে Settings থেকে এই tour আবার চালাতে পারবেন।",
        ],
        simplifiedBody: "শুরু করতে Google দিয়ে সাইন ইন করুন।",
        simplifiedHighlights: [
          "Google Sheets sync চালু হয়।",
          "Settings থেকে tour আবার দেখুন।",
        ],
      },
    ],
    signedInReplayBody:
      "আপনার অ্যাকাউন্ট ইতিমধ্যে কানেক্টেড। এই walkthrough শেষ করে ড্যাশবোর্ডে যেতে পারেন।",
    signedInReplayHighlights: [
      "Settings-এ Google Sheets sync পাওয়া যাবে।",
      "পরে Settings থেকে tour আবার চালাতে পারবেন।",
    ],
    signedInSimplifiedReplayBody:
      "আপনি ইতিমধ্যে সাইন ইন করেছেন। ড্যাশবোর্ডে যেতে শেষ করুন।",
    signedInSimplifiedReplayHighlights: [
      "Sheets sync Settings-এ আছে।",
      "Settings থেকে tour আবার দেখুন।",
    ],
    languageCardTitle: "Ortho-তে আপনি কোন ভাষা ব্যবহার করতে চান?",
    languageCardCta: "চলুন শুরু করি",
    back: "পেছনে",
    next: "পরবর্তী",
    finishTour: "ট্যুর শেষ করুন",
    signInWithGoogle: "Google দিয়ে সাইন ইন",
    toggleDetailed: "বিস্তারিত",
    toggleSimplified: "সহজ",
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
        simplifiedBody: "Ortho 帮你在一个地方管理家庭财务。",
        simplifiedHighlights: [
          "一起管理支出、收入和债务。",
          "数据保存在你的设备上。",
          "桌面端和移动端都可用。",
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
        simplifiedBody: "将数据备份到 Google Sheets。",
        simplifiedHighlights: [
          "将数据推送到表格。",
          "从表格拉回数据。",
          "自动同步保持一致。",
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
        simplifiedBody: "自由导入导出数据。",
        simplifiedHighlights: [
          "导出为 PDF、JSON 或文本。",
          "随时导入数据。",
          "无锁定。",
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
        simplifiedBody: "一目了然地查看财务摘要。",
        simplifiedHighlights: [
          "查看收入、支出和现金流。",
          "图表快速显示趋势。",
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
        simplifiedBody: "在这里添加和编辑日常交易。",
        simplifiedHighlights: [
          "记录支出和收入。",
          "使用预设减少重复录入。",
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
        simplifiedBody: "管理债务和应用设置。",
        simplifiedHighlights: [
          "跟踪债务和房贷还款。",
          "调整分类、所有者和同步。",
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
        simplifiedBody: "随时更改应用语言和货币。",
        simplifiedHighlights: [
          "在设置中切换语言。",
          "切换显示货币。",
        ],
      },
      {
        title: "准备开始",
        body: "使用 Google 登录开始使用 Ortho。",
        highlights: [
          "登录后可启用 Google Sheets 同步。",
          "你可在设置中随时重播本导览。",
        ],
        simplifiedBody: "使用 Google 登录即可开始。",
        simplifiedHighlights: [
          "启用 Google Sheets 同步。",
          "在设置中重播导览。",
        ],
      },
    ],
    signedInReplayBody: "你的账号已连接。你可以完成本导览并继续进入仪表盘。",
    signedInReplayHighlights: [
      "可在设置中使用 Google Sheets 同步。",
      "可在设置中重播本导览。",
    ],
    signedInSimplifiedReplayBody: "你已登录。完成后进入仪表盘。",
    signedInSimplifiedReplayHighlights: [
      "Sheets 同步在设置中。",
      "在设置中重播导览。",
    ],
    languageCardTitle: "你想在 Ortho 中使用哪种语言？",
    languageCardCta: "开始使用",
    back: "返回",
    next: "下一步",
    finishTour: "完成导览",
    signInWithGoogle: "使用 Google 登录",
    toggleDetailed: "详细",
    toggleSimplified: "简要",
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
        simplifiedBody: "Ortho는 가계 재정을 한 곳에서 관리하도록 도와줍니다.",
        simplifiedHighlights: [
          "지출, 수입, 부채를 함께 관리합니다.",
          "데이터는 기기에 저장됩니다.",
          "데스크톱과 모바일에서 작동합니다.",
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
        simplifiedBody: "Google Sheets에 데이터를 백업하세요.",
        simplifiedHighlights: [
          "스프레드시트에 데이터를 보냅니다.",
          "스프레드시트에서 데이터를 가져옵니다.",
          "자동 동기화가 유지합니다.",
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
        simplifiedBody: "데이터를 자유롭게 가져오고 내보냅니다.",
        simplifiedHighlights: [
          "PDF, JSON 또는 텍스트로 내보냅니다.",
          "언제든 데이터를 가져옵니다.",
          "잠금 없음.",
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
        simplifiedBody: "한눈에 재무 요약을 확인하세요.",
        simplifiedHighlights: [
          "수입, 지출, 현금 흐름을 봅니다.",
          "차트가 추세를 빠르게 보여줍니다.",
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
        simplifiedBody: "여기서 일상 거래를 추가하고 편집하세요.",
        simplifiedHighlights: [
          "지출과 수입을 기록합니다.",
          "반복 항목에 프리셋을 사용합니다.",
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
        simplifiedBody: "부채와 앱 설정을 관리하세요.",
        simplifiedHighlights: [
          "부채와 모기지 납부를 추적합니다.",
          "카테고리, 소유자, 동기화를 조정합니다.",
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
        simplifiedBody: "앱 언어와 통화를 언제든 변경하세요.",
        simplifiedHighlights: [
          "설정에서 언어를 변경합니다.",
          "표시 통화를 변경합니다.",
        ],
      },
      {
        title: "시작할 준비",
        body: "Ortho를 시작하려면 Google로 로그인하세요.",
        highlights: [
          "Google Sheets 동기화를 사용하려면 로그인하세요.",
          "설정에서 이 투어를 다시 실행할 수 있습니다.",
        ],
        simplifiedBody: "Google로 로그인하여 시작하세요.",
        simplifiedHighlights: [
          "Google Sheets 동기화를 활성화합니다.",
          "설정에서 투어를 다시 실행합니다.",
        ],
      },
    ],
    signedInReplayBody: "이미 계정이 연결되어 있습니다. 투어를 마치고 대시보드로 이동하세요.",
    signedInReplayHighlights: [
      "Google Sheets 동기화는 설정에서 사용할 수 있습니다.",
      "설정에서 이 투어를 다시 실행할 수 있습니다.",
    ],
    signedInSimplifiedReplayBody:
      "이미 로그인되어 있습니다. 완료하고 대시보드로 이동하세요.",
    signedInSimplifiedReplayHighlights: [
      "Sheets 동기화는 설정에 있습니다.",
      "설정에서 투어를 다시 실행합니다.",
    ],
    languageCardTitle: "Ortho에서 어떤 언어를 사용하시겠어요?",
    languageCardCta: "시작하기",
    back: "뒤로",
    next: "다음",
    finishTour: "투어 완료",
    signInWithGoogle: "Google로 로그인",
    toggleDetailed: "상세",
    toggleSimplified: "간단",
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
        simplifiedBody: "Ortho आपके घर का पैसा एक जगह संभालने में मदद करता है।",
        simplifiedHighlights: [
          "खर्च, आय और कर्ज एक साथ ट्रैक करें।",
          "डेटा आपके डिवाइस पर रहता है।",
          "डेस्कटॉप और मोबाइल पर काम करता है।",
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
        simplifiedBody: "Google Sheets में डेटा बैकअप करें।",
        simplifiedHighlights: [
          "शीट में डेटा भेजें।",
          "शीट से डेटा वापस लाएं।",
          "Auto-sync सब मिलाकर रखता है।",
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
        simplifiedBody: "डेटा आज़ादी से लाएं-ले जाएं।",
        simplifiedHighlights: [
          "PDF, JSON या टेक्स्ट में एक्सपोर्ट।",
          "कभी भी डेटा इम्पोर्ट करें।",
          "कोई लॉक-इन नहीं।",
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
        simplifiedBody: "एक नज़र में वित्तीय सारांश देखें।",
        simplifiedHighlights: [
          "आय, खर्च और कैश फ्लो देखें।",
          "चार्ट से जल्दी ट्रेंड पकड़ें।",
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
        simplifiedBody: "यहाँ दैनिक लेनदेन जोड़ें और संपादित करें।",
        simplifiedHighlights: [
          "खर्च और आय दर्ज करें।",
          "दोहराव वाली entries के लिए प्रीसेट उपयोग करें।",
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
        simplifiedBody: "कर्ज और ऐप सेटिंग्स प्रबंधित करें।",
        simplifiedHighlights: [
          "कर्ज और मॉर्गेज भुगतान ट्रैक करें।",
          "कैटेगरी, मालिक और सिंक समायोजित करें।",
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
        simplifiedBody: "कभी भी ऐप भाषा और मुद्रा बदलें।",
        simplifiedHighlights: [
          "Settings में भाषा बदलें।",
          "डिस्प्ले मुद्रा बदलें।",
        ],
      },
      {
        title: "शुरू करने के लिए तैयार",
        body: "Ortho शुरू करने के लिए Google से साइन इन करें।",
        highlights: [
          "Google Sheets sync के लिए साइन इन करें।",
          "आप इस tour को बाद में Settings से replay कर सकते हैं।",
        ],
        simplifiedBody: "शुरू करने के लिए Google से साइन इन करें।",
        simplifiedHighlights: [
          "Google Sheets sync सक्रिय होता है।",
          "Settings से tour दोबारा देखें।",
        ],
      },
    ],
    signedInReplayBody: "आपका अकाउंट पहले से connected है। यह walkthrough पूरा करके dashboard पर जाएँ।",
    signedInReplayHighlights: [
      "Google Sheets sync Settings में उपलब्ध है।",
      "आप इस tour को Settings से दोबारा चला सकते हैं।",
    ],
    signedInSimplifiedReplayBody:
      "आप पहले से साइन इन हैं। डैशबोर्ड पर जाने के लिए समाप्त करें।",
    signedInSimplifiedReplayHighlights: [
      "Sheets sync Settings में है।",
      "Settings से tour दोबारा देखें।",
    ],
    languageCardTitle: "आप Ortho में कौन सी भाषा उपयोग करना चाहते हैं?",
    languageCardCta: "चलिए शुरू करें",
    back: "वापस",
    next: "आगे",
    finishTour: "टूर समाप्त करें",
    signInWithGoogle: "Google से साइन इन करें",
    toggleDetailed: "विस्तृत",
    toggleSimplified: "सरल",
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
        simplifiedBody: "Ortho は家計を1か所で管理するお手伝いをします。",
        simplifiedHighlights: [
          "支出・収入・負債をまとめて管理。",
          "データは端末に保存されます。",
          "デスクトップとモバイルで使えます。",
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
        simplifiedBody: "Google Sheets にデータをバックアップ。",
        simplifiedHighlights: [
          "シートにデータを送信。",
          "シートからデータを取得。",
          "自動同期で一貫性を維持。",
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
        simplifiedBody: "データを自由に入出力できます。",
        simplifiedHighlights: [
          "PDF・JSON・テキストでエクスポート。",
          "いつでもデータをインポート。",
          "ロックインなし。",
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
        simplifiedBody: "財務の概要を一目で確認。",
        simplifiedHighlights: [
          "収入・支出・キャッシュフローを表示。",
          "チャートでトレンドを素早く確認。",
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
        simplifiedBody: "日々の取引をここで追加・編集。",
        simplifiedHighlights: [
          "支出と収入を記録。",
          "繰り返し入力にプリセットを使用。",
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
        simplifiedBody: "負債とアプリ設定を管理。",
        simplifiedHighlights: [
          "負債と住宅ローンの支払いを追跡。",
          "カテゴリ・所有者・同期を調整。",
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
        simplifiedBody: "アプリの言語と通貨はいつでも変更可能。",
        simplifiedHighlights: [
          "設定で言語を切り替え。",
          "表示通貨を切り替え。",
        ],
      },
      {
        title: "開始準備完了",
        body: "Google でサインインして Ortho を開始してください。",
        highlights: [
          "Google Sheets 同期を使うにはサインインが必要です。",
          "このツアーは設定から再実行できます。",
        ],
        simplifiedBody: "Google でサインインして開始。",
        simplifiedHighlights: [
          "Google Sheets 同期が有効になります。",
          "設定からツアーを再実行。",
        ],
      },
    ],
    signedInReplayBody:
      "アカウントはすでに接続されています。このウォークスルーを完了してダッシュボードへ進んでください。",
    signedInReplayHighlights: [
      "Google Sheets 同期は設定から利用できます。",
      "このツアーは設定から再実行できます。",
    ],
    signedInSimplifiedReplayBody:
      "すでにサインイン済みです。完了してダッシュボードへ。",
    signedInSimplifiedReplayHighlights: [
      "Sheets 同期は設定にあります。",
      "設定からツアーを再実行。",
    ],
    languageCardTitle: "Orthoで使用する言語を選択してください",
    languageCardCta: "はじめる",
    back: "戻る",
    next: "次へ",
    finishTour: "ツアーを終了",
    signInWithGoogle: "Googleでサインイン",
    toggleDetailed: "詳細",
    toggleSimplified: "簡潔",
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

const TOUR_STEP_CLASS =
  "min-h-[400px] md:min-h-[440px] flex flex-col overflow-hidden";
const LANGUAGE_STEP_CLASS =
  "min-h-[260px] md:min-h-[280px] flex flex-col overflow-hidden";

const STEP_TRANSITION_DURATION = { duration: 0.45, ease: "easeOut" as const };

const DESKTOP_VARIANTS = {
  initial: { opacity: 0, y: 12, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.985 },
};

const MOBILE_VARIANTS = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 300, scale: 0.95 }),
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -300, scale: 0.95 }),
};

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 300;

export function resolveSwipeAction(
  offsetX: number,
  velocityX: number,
  currentIndex: number,
  lastIndex: number,
): "next" | "back" | null {
  const swipedLeft =
    offsetX < -SWIPE_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD;
  const swipedRight =
    offsetX > SWIPE_THRESHOLD || velocityX > SWIPE_VELOCITY_THRESHOLD;
  if (swipedLeft && currentIndex < lastIndex) return "next";
  if (swipedRight && currentIndex > 0) return "back";
  return null;
}

function TourDotIndicator({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 flex justify-center gap-1.5 py-4 safe-area-pb"
      role="tablist"
      aria-label="Tour progress"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Step ${i + 1} of ${total}`}
          className={`inline-block size-2 rounded-full transition-colors duration-200 ${
            i === current ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function setTourCompleted(): void {
  storage.setItem(TOUR_COMPLETED_KEY, "1");
  storage.setItem(RETURNING_USER_KEY, "1");
}

export function TourPage() {
  const { isSignedIn, signIn } = useGoogleAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [tourLocale, setTourLocale] = useState("en");
  const [isSimplified, setIsSimplified] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isReplay = searchParams.get("replay") === "1";
  const copy = TOUR_COPY[tourLocale] ?? TOUR_COPY.en;
  const steps = copy.steps;
  const totalSteps = steps.length + 1;
  const isLanguageStep = stepIndex === 0;
  const lastIndex = totalSteps - 1;
  const isLast = stepIndex === lastIndex;
  const contentStepIndex = Math.max(0, stepIndex - 1);
  const baseStep = steps[contentStepIndex]!;

  const resolvedBody = isSimplified ? baseStep.simplifiedBody : baseStep.body;
  const resolvedHighlights = isSimplified
    ? baseStep.simplifiedHighlights
    : baseStep.highlights;

  const step =
    isLast && isSignedIn
      ? {
          ...baseStep,
          body: isSimplified
            ? copy.signedInSimplifiedReplayBody
            : copy.signedInReplayBody,
          highlights: isSimplified
            ? copy.signedInSimplifiedReplayHighlights
            : copy.signedInReplayHighlights,
        }
      : {
          ...baseStep,
          body: resolvedBody,
          highlights: resolvedHighlights,
        };

  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${totalSteps}`,
    [stepIndex, totalSteps],
  );

  const variants = isMobile ? MOBILE_VARIANTS : DESKTOP_VARIANTS;

  useEffect(() => {
    i18n.changeLanguage("en");
    persistLocale("en");
  }, []);

  if (isSignedIn && !isReplay) {
    return <Navigate to="/dashboard" replace />;
  }

  const goBack = () => {
    setDirection(-1);
    setStepIndex((prev) => Math.max(0, prev - 1));
  };
  const goNext = () => {
    setDirection(1);
    setStepIndex((prev) => Math.min(lastIndex, prev + 1));
  };
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

  const handleQuitTour = () => {
    navigate(isSignedIn ? "/dashboard" : "/");
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const action = resolveSwipeAction(
      info.offset.x,
      info.velocity.x,
      stepIndex,
      lastIndex,
    );
    if (action === "next") goNext();
    else if (action === "back") goBack();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center md:px-4 py-8">
      <div className={`w-full max-w-2xl ${isMobile ? "overflow-hidden" : ""}`}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {isLanguageStep ? (
            <motion.div
              key="language-step"
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={STEP_TRANSITION_DURATION}
            >
              <div className={LANGUAGE_STEP_CLASS}>
                <div className="relative pt-6 pb-2 text-center px-4">
                  <button
                    type="button"
                    onClick={handleQuitTour}
                    className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-[var(--surface-2)] hover:text-foreground focus:ring-2 focus:ring-[var(--focus-ring)]/45 focus:ring-offset-2 focus:outline-none"
                    data-testid="tour-close"
                  >
                    <X className="size-6" />
                    <span className="sr-only">Close</span>
                  </button>
                  <h2 className="text-xl md:text-2xl font-semibold leading-none tracking-tight">
                    {copy.languageCardTitle}
                  </h2>
                </div>
                <div className="flex flex-1 flex-col items-center gap-4 text-center pt-2 pb-6 px-4">
                  <div className="w-full max-w-md">
                    <Select value={tourLocale} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="h-11 w-full">
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
                  </div>
                  <div className="pt-1">
                    <Button
                      type="button"
                      onClick={goNext}
                      className="h-11 min-w-52"
                      data-testid="tour-language-continue"
                    >
                      {copy.languageCardCta}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`tour-step-${stepIndex}`}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={STEP_TRANSITION_DURATION}
              {...(isMobile
                ? {
                    drag: "x" as const,
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.2,
                    onDragEnd: handleDragEnd,
                  }
                : {})}
            >
              <div className={TOUR_STEP_CLASS}>
                <div className="relative space-y-2 pb-2 px-4">
                  <button
                    type="button"
                    onClick={handleQuitTour}
                    className="absolute right-3 top-0 inline-flex size-11 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-[var(--surface-2)] hover:text-foreground focus:ring-2 focus:ring-[var(--focus-ring)]/45 focus:ring-offset-2 focus:outline-none"
                    data-testid="tour-close"
                  >
                    <X className="size-6" />
                    <span className="sr-only">Close</span>
                  </button>
                  <div className="text-sm text-muted-foreground">{progressLabel}</div>
                  <h2 className="text-2xl font-semibold leading-none tracking-tight">{step.title}</h2>
                </div>
                <div className="flex flex-1 flex-col gap-8 pt-4 px-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`content-${stepIndex}-${isSimplified}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {step.body}
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground mt-8">
                        {step.highlights.map((item) => (
                          <li key={item} className="leading-relaxed">
                            - {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" onClick={goBack}>
                      {copy.back}
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-dotted"
                      onClick={() => setIsSimplified((prev) => !prev)}
                      aria-label={
                        isSimplified
                          ? copy.toggleDetailed
                          : copy.toggleSimplified
                      }
                      data-testid="tour-text-toggle"
                    >
                      {isSimplified
                        ? copy.toggleDetailed
                        : copy.toggleSimplified}
                    </button>
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isMobile && (
        <TourDotIndicator total={totalSteps} current={stepIndex} />
      )}
    </div>
  );
}
