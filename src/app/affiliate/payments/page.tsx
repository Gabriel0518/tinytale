"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import {SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { resolveLocaleCopy } from '@/lib/locale-copy';

interface PaymentMethod {
  _id: string;
  type: "paypal" | "bank_transfer" | "usdt";
  isDefault: boolean;
  paypalEmail?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  routingNumber?: string;
  bankAddress?: string;
  usdtAddress?: string;
  usdtNetwork?: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  status: "pending" | "approved" | "rejected" | "paid";
  createdAt: string;
}

interface DashboardData {
  availableBalance: number;
  pendingClearance: number;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400 border border-green-500/20",
  approved: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  rejected: "bg-red-500/10 text-red-400 border border-red-500/20" };

type PaymentsCopy = {
  typeLabels: {
    paypal: string;
    bankTransfer: string;
    usdt: string;
    default: string;
  };
  statusLabels: {
    paid: string;
    approved: string;
    pending: string;
    rejected: string;
  };
  withdrawModal: {
    title: string;
    available: string;
    paymentMethod: string;
    amountUsd: string;
    minWithdrawal: string;
    amount: string;
    fee: string;
    netAmount: string;
    cancel: string;
    confirm: string;
    processing: string;
    max: string;
    errors: {
      min: string;
      insufficient: string;
      selectMethod: string;
      failed: string;
    };
  };
  paymentModal: {
    editTitle: string;
    addTitle: string;
    paypalEmail: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    routingNumber: string;
    bankAddress: string;
    usdtAddress: string;
    network: string;
    setDefault: string;
    cancel: string;
    save: string;
    saving: string;
    placeholders: {
      paypal: string;
      bankName: string;
      accountNumber: string;
      accountHolderName: string;
      routingNumber: string;
      bankAddress: string;
      usdtAddress: string;
    };
    errors: {
      paypalRequired: string;
      bankRequired: string;
      usdtRequired: string;
      saveFailed: string;
    };
  };
  page: {
    title: string;
    requestWithdrawal: string;
    availableBalance: string;
    minThreshold: string;
    pendingClearance: string;
    historyTitle: string;
    historyHeaders: [string, string, string, string, string, string];
    noWithdrawals: string;
    pageOf: (page: number, total: number) => string;
    prev: string;
    next: string;
    paymentMethodsTitle: string;
    addPaymentMethod: string;
    noMethods: string;
    setDefault: string;
    edit: string;
    delete: string;
    deleteTitle: string;
    deleteAction: string;
    deleteConfirm: string;
    amountPlaceholder: string;
  };
};

const COPY: FlexibleRecord<SupportedLocale, PaymentsCopy> = {
  en: {
    typeLabels: { paypal: "PayPal", bankTransfer: "Bank Transfer", usdt: "USDT", default: "Default" },
    statusLabels: { paid: "Paid", approved: "Approved", pending: "Pending", rejected: "Rejected" },
    withdrawModal: {
      title: "Request Withdrawal",
      available: "Available",
      paymentMethod: "Payment Method",
      amountUsd: "Amount (USD)",
      minWithdrawal: "Minimum withdrawal: $50.00",
      amount: "Amount",
      fee: "Fee (2%)",
      netAmount: "Net Amount",
      cancel: "Cancel",
      confirm: "Confirm Withdrawal",
      processing: "Processing...",
      max: "MAX",
      errors: {
        min: "Minimum withdrawal is $50.00",
        insufficient: "Insufficient balance",
        selectMethod: "Select a payment method",
        failed: "Withdrawal failed" } },
    paymentModal: {
      editTitle: "Edit Payment Method",
      addTitle: "Add Payment Method",
      paypalEmail: "PayPal Email",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      accountHolderName: "Account Holder Name",
      routingNumber: "Routing Number",
      bankAddress: "Bank Address",
      usdtAddress: "USDT Address",
      network: "Network",
      setDefault: "Set as default payment method",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "Bank of America",
        accountNumber: "1234567890",
        accountHolderName: "John Doe",
        routingNumber: "021000021",
        bankAddress: "123 Main St, New York, NY",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "PayPal email is required",
        bankRequired: "Bank name, account number and holder name are required",
        usdtRequired: "USDT address is required",
        saveFailed: "Failed to save" } },
    page: {
      title: "Payments",
      requestWithdrawal: "Request Withdrawal",
      availableBalance: "Available Balance",
      minThreshold: "Min Payout Threshold",
      pendingClearance: "Pending Clearance",
      historyTitle: "Withdrawal History",
      historyHeaders: ["Date", "Amount", "Fee", "Net Amount", "Method", "Status"],
      noWithdrawals: "No withdrawals yet",
      pageOf: (page, total) => `Page ${page} of ${total}`,
      prev: "Prev",
      next: "Next",
      paymentMethodsTitle: "Payment Methods",
      addPaymentMethod: "Add Payment Method",
      noMethods: "No payment methods added yet",
      setDefault: "Set Default",
      edit: "Edit",
      delete: "Delete",
      deleteTitle: "Delete Payment Method",
      deleteAction: "Delete",
      deleteConfirm: "Delete this payment method?",
      amountPlaceholder: "0.00" } },
  zh: {
    typeLabels: { paypal: "PayPal", bankTransfer: "银行转账", usdt: "USDT", default: "默认" },
    statusLabels: { paid: "已打款", approved: "已通过", pending: "待处理", rejected: "已拒绝" },
    withdrawModal: {
      title: "申请提现",
      available: "可提现",
      paymentMethod: "收款方式",
      amountUsd: "金额 (USD)",
      minWithdrawal: "最低提现金额：$50.00",
      amount: "提现金额",
      fee: "手续费 (2%)",
      netAmount: "到账金额",
      cancel: "取消",
      confirm: "确认提现",
      processing: "处理中...",
      max: "最大",
      errors: {
        min: "最低提现金额为 $50.00",
        insufficient: "余额不足",
        selectMethod: "请选择收款方式",
        failed: "提现失败" } },
    paymentModal: {
      editTitle: "编辑收款方式",
      addTitle: "新增收款方式",
      paypalEmail: "PayPal 邮箱",
      bankName: "银行名称",
      accountNumber: "账号",
      accountHolderName: "账户姓名",
      routingNumber: "路由号",
      bankAddress: "银行地址",
      usdtAddress: "USDT 地址",
      network: "网络",
      setDefault: "设为默认收款方式",
      cancel: "取消",
      save: "保存",
      saving: "保存中...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "中国银行",
        accountNumber: "1234567890",
        accountHolderName: "张三",
        routingNumber: "021000021",
        bankAddress: "中国上海...",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "请填写 PayPal 邮箱",
        bankRequired: "请填写银行名称、账号和账户姓名",
        usdtRequired: "请填写 USDT 地址",
        saveFailed: "保存失败" } },
    page: {
      title: "收款管理",
      requestWithdrawal: "申请提现",
      availableBalance: "可提现余额",
      minThreshold: "最低打款门槛",
      pendingClearance: "待结算",
      historyTitle: "提现记录",
      historyHeaders: ["日期", "金额", "手续费", "到账金额", "方式", "状态"],
      noWithdrawals: "暂无提现记录",
      pageOf: (page, total) => `第 ${page} / ${total} 页`,
      prev: "上一页",
      next: "下一页",
      paymentMethodsTitle: "收款方式",
      addPaymentMethod: "新增收款方式",
      noMethods: "暂无收款方式",
      setDefault: "设为默认",
      edit: "编辑",
      delete: "删除",
      deleteTitle: "删除收款方式",
      deleteAction: "删除",
      deleteConfirm: "确认删除该收款方式？",
      amountPlaceholder: "0.00" } },
  ja: {
    typeLabels: { paypal: "PayPal", bankTransfer: "銀行振込", usdt: "USDT", default: "デフォルト" },
    statusLabels: { paid: "支払済み", approved: "承認済み", pending: "保留中", rejected: "却下" },
    withdrawModal: {
      title: "出金申請",
      available: "利用可能残高",
      paymentMethod: "受取方法",
      amountUsd: "金額 (USD)",
      minWithdrawal: "最低出金額: $50.00",
      amount: "金額",
      fee: "手数料 (2%)",
      netAmount: "受取額",
      cancel: "キャンセル",
      confirm: "出金を確定",
      processing: "処理中...",
      max: "MAX",
      errors: {
        min: "最低出金額は $50.00 です",
        insufficient: "残高不足です",
        selectMethod: "受取方法を選択してください",
        failed: "出金に失敗しました" } },
    paymentModal: {
      editTitle: "受取方法を編集",
      addTitle: "受取方法を追加",
      paypalEmail: "PayPal メール",
      bankName: "銀行名",
      accountNumber: "口座番号",
      accountHolderName: "口座名義",
      routingNumber: "ルーティング番号",
      bankAddress: "銀行住所",
      usdtAddress: "USDT アドレス",
      network: "ネットワーク",
      setDefault: "デフォルトに設定",
      cancel: "キャンセル",
      save: "保存",
      saving: "保存中...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "Mitsubishi UFJ",
        accountNumber: "1234567890",
        accountHolderName: "Taro Yamada",
        routingNumber: "021000021",
        bankAddress: "Tokyo, Japan",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "PayPalメールは必須です",
        bankRequired: "銀行名・口座番号・口座名義は必須です",
        usdtRequired: "USDTアドレスは必須です",
        saveFailed: "保存に失敗しました" } },
    page: {
      title: "支払い管理",
      requestWithdrawal: "出金申請",
      availableBalance: "利用可能残高",
      minThreshold: "最低出金額",
      pendingClearance: "精算待ち",
      historyTitle: "出金履歴",
      historyHeaders: ["日付", "金額", "手数料", "受取額", "方法", "状態"],
      noWithdrawals: "出金履歴はありません",
      pageOf: (page, total) => `${page} / ${total} ページ`,
      prev: "前へ",
      next: "次へ",
      paymentMethodsTitle: "受取方法",
      addPaymentMethod: "受取方法を追加",
      noMethods: "受取方法がありません",
      setDefault: "デフォルトに設定",
      edit: "編集",
      delete: "削除",
      deleteTitle: "受取方法を削除",
      deleteAction: "削除",
      deleteConfirm: "この受取方法を削除しますか？",
      amountPlaceholder: "0.00" } },
  es: {
    typeLabels: { paypal: "PayPal", bankTransfer: "Transferencia bancaria", usdt: "USDT", default: "Predeterminado" },
    statusLabels: { paid: "Pagado", approved: "Aprobado", pending: "Pendiente", rejected: "Rechazado" },
    withdrawModal: {
      title: "Solicitar retiro",
      available: "Disponible",
      paymentMethod: "Método de pago",
      amountUsd: "Monto (USD)",
      minWithdrawal: "Retiro mínimo: $50.00",
      amount: "Monto",
      fee: "Comisión (2%)",
      netAmount: "Monto neto",
      cancel: "Cancelar",
      confirm: "Confirmar retiro",
      processing: "Procesando...",
      max: "MÁX",
      errors: {
        min: "El retiro mínimo es $50.00",
        insufficient: "Saldo insuficiente",
        selectMethod: "Selecciona un método de pago",
        failed: "Error al retirar" } },
    paymentModal: {
      editTitle: "Editar método de pago",
      addTitle: "Agregar método de pago",
      paypalEmail: "Email de PayPal",
      bankName: "Nombre del banco",
      accountNumber: "Número de cuenta",
      accountHolderName: "Titular",
      routingNumber: "Número de ruta",
      bankAddress: "Dirección del banco",
      usdtAddress: "Dirección USDT",
      network: "Red",
      setDefault: "Establecer como predeterminado",
      cancel: "Cancelar",
      save: "Guardar",
      saving: "Guardando...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "Bank of America",
        accountNumber: "1234567890",
        accountHolderName: "John Doe",
        routingNumber: "021000021",
        bankAddress: "123 Main St, New York, NY",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "El email de PayPal es obligatorio",
        bankRequired: "Se requieren banco, número de cuenta y titular",
        usdtRequired: "La dirección USDT es obligatoria",
        saveFailed: "No se pudo guardar" } },
    page: {
      title: "Pagos",
      requestWithdrawal: "Solicitar retiro",
      availableBalance: "Saldo disponible",
      minThreshold: "Umbral mínimo",
      pendingClearance: "Pendiente de liquidación",
      historyTitle: "Historial de retiros",
      historyHeaders: ["Fecha", "Monto", "Comisión", "Monto neto", "Método", "Estado"],
      noWithdrawals: "Aún no hay retiros",
      pageOf: (page, total) => `Página ${page} de ${total}`,
      prev: "Anterior",
      next: "Siguiente",
      paymentMethodsTitle: "Métodos de pago",
      addPaymentMethod: "Agregar método de pago",
      noMethods: "Aún no agregaste métodos de pago",
      setDefault: "Predeterminar",
      edit: "Editar",
      delete: "Eliminar",
      deleteTitle: "Eliminar método de pago",
      deleteAction: "Eliminar",
      deleteConfirm: "¿Eliminar este método de pago?",
      amountPlaceholder: "0.00" } },
  pt: {
    typeLabels: { paypal: "PayPal", bankTransfer: "Transferência bancária", usdt: "USDT", default: "Padrão" },
    statusLabels: { paid: "Pago", approved: "Aprovado", pending: "Pendente", rejected: "Rejeitado" },
    withdrawModal: {
      title: "Solicitar saque",
      available: "Disponível",
      paymentMethod: "Método de pagamento",
      amountUsd: "Valor (USD)",
      minWithdrawal: "Saque mínimo: $50.00",
      amount: "Valor",
      fee: "Taxa (2%)",
      netAmount: "Valor líquido",
      cancel: "Cancelar",
      confirm: "Confirmar saque",
      processing: "Processando...",
      max: "MÁX",
      errors: {
        min: "O saque mínimo é $50.00",
        insufficient: "Saldo insuficiente",
        selectMethod: "Selecione um método de pagamento",
        failed: "Falha no saque" } },
    paymentModal: {
      editTitle: "Editar método de pagamento",
      addTitle: "Adicionar método de pagamento",
      paypalEmail: "Email PayPal",
      bankName: "Nome do banco",
      accountNumber: "Número da conta",
      accountHolderName: "Nome do titular",
      routingNumber: "Routing number",
      bankAddress: "Endereço do banco",
      usdtAddress: "Endereço USDT",
      network: "Rede",
      setDefault: "Definir como padrão",
      cancel: "Cancelar",
      save: "Salvar",
      saving: "Salvando...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "Bank of America",
        accountNumber: "1234567890",
        accountHolderName: "John Doe",
        routingNumber: "021000021",
        bankAddress: "123 Main St, New York, NY",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "O email PayPal é obrigatório",
        bankRequired: "Banco, conta e titular são obrigatórios",
        usdtRequired: "O endereço USDT é obrigatório",
        saveFailed: "Falha ao salvar" } },
    page: {
      title: "Pagamentos",
      requestWithdrawal: "Solicitar saque",
      availableBalance: "Saldo disponível",
      minThreshold: "Limite mínimo",
      pendingClearance: "Liberação pendente",
      historyTitle: "Histórico de saques",
      historyHeaders: ["Data", "Valor", "Taxa", "Valor líquido", "Método", "Status"],
      noWithdrawals: "Ainda não há saques",
      pageOf: (page, total) => `Página ${page} de ${total}`,
      prev: "Anterior",
      next: "Próxima",
      paymentMethodsTitle: "Métodos de pagamento",
      addPaymentMethod: "Adicionar método",
      noMethods: "Nenhum método de pagamento adicionado",
      setDefault: "Definir padrão",
      edit: "Editar",
      delete: "Excluir",
      deleteTitle: "Excluir método de pagamento",
      deleteAction: "Excluir",
      deleteConfirm: "Excluir este método de pagamento?",
      amountPlaceholder: "0.00" } },
  hi: {
    typeLabels: { paypal: "PayPal", bankTransfer: "बैंक ट्रांसफर", usdt: "USDT", default: "डिफॉल्ट" },
    statusLabels: { paid: "भुगतान हो चुका", approved: "स्वीकृत", pending: "लंबित", rejected: "अस्वीकृत" },
    withdrawModal: {
      title: "निकासी अनुरोध",
      available: "उपलब्ध",
      paymentMethod: "भुगतान विधि",
      amountUsd: "राशि (USD)",
      minWithdrawal: "न्यूनतम निकासी: $50.00",
      amount: "राशि",
      fee: "शुल्क (2%)",
      netAmount: "शुद्ध राशि",
      cancel: "रद्द करें",
      confirm: "निकासी पुष्टि करें",
      processing: "प्रोसेस हो रहा है...",
      max: "अधिकतम",
      errors: {
        min: "न्यूनतम निकासी $50.00 है",
        insufficient: "पर्याप्त बैलेंस नहीं",
        selectMethod: "कृपया भुगतान विधि चुनें",
        failed: "निकासी असफल रही" } },
    paymentModal: {
      editTitle: "भुगतान विधि संपादित करें",
      addTitle: "भुगतान विधि जोड़ें",
      paypalEmail: "PayPal ईमेल",
      bankName: "बैंक नाम",
      accountNumber: "खाता संख्या",
      accountHolderName: "खाता धारक नाम",
      routingNumber: "रूटिंग नंबर",
      bankAddress: "बैंक पता",
      usdtAddress: "USDT पता",
      network: "नेटवर्क",
      setDefault: "डिफॉल्ट भुगतान विधि बनाएं",
      cancel: "रद्द करें",
      save: "सहेजें",
      saving: "सहेजा जा रहा है...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "Bank of America",
        accountNumber: "1234567890",
        accountHolderName: "John Doe",
        routingNumber: "021000021",
        bankAddress: "123 Main St, New York, NY",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "PayPal ईमेल आवश्यक है",
        bankRequired: "बैंक नाम, खाता संख्या और नाम आवश्यक हैं",
        usdtRequired: "USDT पता आवश्यक है",
        saveFailed: "सेव नहीं हो सका" } },
    page: {
      title: "पेमेंट्स",
      requestWithdrawal: "निकासी अनुरोध",
      availableBalance: "उपलब्ध बैलेंस",
      minThreshold: "न्यूनतम भुगतान सीमा",
      pendingClearance: "लंबित क्लियरेंस",
      historyTitle: "निकासी इतिहास",
      historyHeaders: ["तारीख", "राशि", "शुल्क", "शुद्ध राशि", "विधि", "स्थिति"],
      noWithdrawals: "अभी तक कोई निकासी नहीं",
      pageOf: (page, total) => `पेज ${page} / ${total}`,
      prev: "पिछला",
      next: "अगला",
      paymentMethodsTitle: "भुगतान विधियाँ",
      addPaymentMethod: "भुगतान विधि जोड़ें",
      noMethods: "कोई भुगतान विधि नहीं जोड़ी गई",
      setDefault: "डिफॉल्ट सेट करें",
      edit: "संपादित करें",
      delete: "हटाएं",
      deleteTitle: "भुगतान विधि हटाएँ",
      deleteAction: "हटाएँ",
      deleteConfirm: "क्या यह भुगतान विधि हटानी है?",
      amountPlaceholder: "0.00" } },
  id: {
    typeLabels: { paypal: "PayPal", bankTransfer: "Transfer bank", usdt: "USDT", default: "Default" },
    statusLabels: { paid: "Dibayar", approved: "Disetujui", pending: "Menunggu", rejected: "Ditolak" },
    withdrawModal: {
      title: "Ajukan penarikan",
      available: "Tersedia",
      paymentMethod: "Metode pembayaran",
      amountUsd: "Jumlah (USD)",
      minWithdrawal: "Penarikan minimum: $50.00",
      amount: "Jumlah",
      fee: "Biaya (2%)",
      netAmount: "Jumlah bersih",
      cancel: "Batal",
      confirm: "Konfirmasi penarikan",
      processing: "Memproses...",
      max: "MAKS",
      errors: {
        min: "Penarikan minimum adalah $50.00",
        insufficient: "Saldo tidak cukup",
        selectMethod: "Pilih metode pembayaran",
        failed: "Penarikan gagal" } },
    paymentModal: {
      editTitle: "Ubah metode pembayaran",
      addTitle: "Tambah metode pembayaran",
      paypalEmail: "Email PayPal",
      bankName: "Nama bank",
      accountNumber: "Nomor rekening",
      accountHolderName: "Nama pemilik rekening",
      routingNumber: "Routing number",
      bankAddress: "Alamat bank",
      usdtAddress: "Alamat USDT",
      network: "Jaringan",
      setDefault: "Jadikan metode default",
      cancel: "Batal",
      save: "Simpan",
      saving: "Menyimpan...",
      placeholders: {
        paypal: "you@example.com",
        bankName: "Bank of America",
        accountNumber: "1234567890",
        accountHolderName: "John Doe",
        routingNumber: "021000021",
        bankAddress: "123 Main St, New York, NY",
        usdtAddress: "T..." },
      errors: {
        paypalRequired: "Email PayPal wajib diisi",
        bankRequired: "Nama bank, nomor rekening, dan nama pemilik wajib diisi",
        usdtRequired: "Alamat USDT wajib diisi",
        saveFailed: "Gagal menyimpan" } },
    page: {
      title: "Pembayaran",
      requestWithdrawal: "Ajukan penarikan",
      availableBalance: "Saldo tersedia",
      minThreshold: "Batas payout minimum",
      pendingClearance: "Pending clearance",
      historyTitle: "Riwayat penarikan",
      historyHeaders: ["Tanggal", "Jumlah", "Biaya", "Jumlah bersih", "Metode", "Status"],
      noWithdrawals: "Belum ada penarikan",
      pageOf: (page, total) => `Halaman ${page} dari ${total}`,
      prev: "Sebelumnya",
      next: "Berikutnya",
      paymentMethodsTitle: "Metode pembayaran",
      addPaymentMethod: "Tambah metode pembayaran",
      noMethods: "Belum ada metode pembayaran",
      setDefault: "Jadikan default",
      edit: "Ubah",
      delete: "Hapus",
      deleteTitle: "Hapus metode pembayaran",
      deleteAction: "Hapus",
      deleteConfirm: "Hapus metode pembayaran ini?",
      amountPlaceholder: "0.00" } } };

const DATE_LOCALE_MAP: FlexibleRecord<SupportedLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  es: "es-ES",
  pt: "pt-BR",
  hi: "hi-IN",
  id: "id-ID",
  ko: "ko-KR",
  fr: "fr-FR" };

function maskValue(val: string | undefined) {
  if (!val || val.length < 6) return val || "****";
  return val.slice(0, 3) + "****" + val.slice(-3);
}

function getTypeLabel(type: string, t: PaymentsCopy) {
  const normalizedType = type.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalizedType === "paypal") return t.typeLabels.paypal;
  if (normalizedType === "bank_transfer") return t.typeLabels.bankTransfer;
  if (normalizedType === "usdt") return t.typeLabels.usdt;
  return type;
}

function TypeIcon({ type }: { type: string }) {
  if (type === "paypal") {
    return (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    );
  }
  if (type === "bank_transfer") {
    return (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
}

function WithdrawModal({
  open,
  onClose,
  balance,
  methods,
  token,
  onSuccess,
  t }: {
  open: boolean;
  onClose: () => void;
  balance: number;
  methods: PaymentMethod[];
  token: string;
  onSuccess: () => void;
  t: PaymentsCopy;
}) {
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState(methods.find((m) => m.isDefault)?._id || methods[0]?._id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setError("");
      setMethodId(methods.find((m) => m.isDefault)?._id || methods[0]?._id || "");
    }
  }, [open, methods]);

  const numAmount = parseFloat(amount) || 0;
  const fee = +(numAmount * 0.02).toFixed(2);
  const net = +(numAmount - fee).toFixed(2);

  const handleSubmit = async () => {
    if (numAmount < 50) return setError(t.withdrawModal.errors.min);
    if (numAmount > balance) return setError(t.withdrawModal.errors.insufficient);
    if (!methodId) return setError(t.withdrawModal.errors.selectMethod);
    setLoading(true);
    setError("");
    try {
      await promoterApi.withdraw(token, { amount: numAmount, paymentMethodId: methodId });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || t.withdrawModal.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="keyboard-safe-scroll keyboard-safe-form w-full max-w-md rounded-2xl rounded-b-none bg-[#1a1a2e] p-6 shadow-2xl sm:rounded-b-2xl"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - min(var(--tinytale-keyboard-inset, 0px), 16rem) - 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-1">{t.withdrawModal.title}</h2>
        <p className="text-gray-400 text-sm mb-5">{t.withdrawModal.available}: <span className="text-green-400 font-medium">${balance.toFixed(2)}</span></p>

        <label className="block text-sm text-gray-400 mb-1">{t.withdrawModal.paymentMethod}</label>
        <select
          value={methodId}
          onChange={(e) => setMethodId(e.target.value)}
          className="w-full bg-[#0f0f17] border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm mb-4 outline-none focus:border-purple-500"
        >
          {methods.map((m) => (
            <option key={m._id} value={m._id}>
              {getTypeLabel(m.type, t)} {m.isDefault ? `(${t.typeLabels.default})` : ""}
            </option>
          ))}
        </select>

        <label className="block text-sm text-gray-400 mb-1">{t.withdrawModal.amountUsd}</label>
        <div className="relative mb-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min={50}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t.page.amountPlaceholder}
            className="w-full bg-[#0f0f17] border border-gray-700/50 rounded-lg pl-7 pr-16 py-2.5 text-white text-sm outline-none focus:border-purple-500"
          />
          <button
            type="button"
            onClick={() => setAmount(balance.toFixed(2))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-600/30"
          >
            {t.withdrawModal.max}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{t.withdrawModal.minWithdrawal}</p>

        {numAmount > 0 && (
          <div className="bg-[#0f0f17] rounded-lg p-3 mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400"><span>{t.withdrawModal.amount}</span><span className="text-white">${numAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>{t.withdrawModal.fee}</span><span className="text-red-400">-${fee.toFixed(2)}</span></div>
            <div className="border-t border-gray-700/50 pt-1.5 flex justify-between font-medium"><span className="text-gray-300">{t.withdrawModal.netAmount}</span><span className="text-green-400">${net.toFixed(2)}</span></div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700/50 text-gray-300 hover:bg-gray-800/50 text-sm">{t.withdrawModal.cancel}</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? t.withdrawModal.processing : t.withdrawModal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPaymentModal({
  open,
  onClose,
  method,
  token,
  onSuccess,
  t }: {
  open: boolean;
  onClose: () => void;
  method: PaymentMethod | null;
  token: string;
  onSuccess: () => void;
  t: PaymentsCopy;
}) {
  const isEdit = !!method;
  const [tab, setTab] = useState<"paypal" | "bank_transfer" | "usdt">(method?.type || "paypal");
  const [form, setForm] = useState({
    paypalEmail: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    routingNumber: "",
    bankAddress: "",
    usdtAddress: "",
    usdtNetwork: "TRC20",
    isDefault: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && method) {
      setTab(method.type);
      setForm({
        paypalEmail: method.paypalEmail || "",
        bankName: method.bankName || "",
        accountNumber: method.accountNumber || "",
        accountHolderName: method.accountHolderName || "",
        routingNumber: method.routingNumber || "",
        bankAddress: method.bankAddress || "",
        usdtAddress: method.usdtAddress || "",
        usdtNetwork: method.usdtNetwork || "TRC20",
        isDefault: method.isDefault });
    } else if (open) {
      setTab("paypal");
      setForm({ paypalEmail: "", bankName: "", accountNumber: "", accountHolderName: "", routingNumber: "", bankAddress: "", usdtAddress: "", usdtNetwork: "TRC20", isDefault: false });
    }
    setError("");
  }, [open, method]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    setError("");
    const payload: any = { type: tab, isDefault: form.isDefault };
    if (tab === "paypal") {
      if (!form.paypalEmail) { setError(t.paymentModal.errors.paypalRequired); setLoading(false); return; }
      payload.paypalEmail = form.paypalEmail;
    } else if (tab === "bank_transfer") {
      if (!form.bankName || !form.accountNumber || !form.accountHolderName) { setError(t.paymentModal.errors.bankRequired); setLoading(false); return; }
      payload.bankName = form.bankName;
      payload.accountNumber = form.accountNumber;
      payload.accountHolderName = form.accountHolderName;
      payload.routingNumber = form.routingNumber;
      payload.bankAddress = form.bankAddress;
    } else {
      if (!form.usdtAddress) { setError(t.paymentModal.errors.usdtRequired); setLoading(false); return; }
      payload.usdtAddress = form.usdtAddress;
      payload.usdtNetwork = form.usdtNetwork;
    }
    try {
      if (isEdit) {
        await promoterApi.updatePaymentMethod(token, method._id, payload);
      } else {
        await promoterApi.addPaymentMethod(token, payload);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || t.paymentModal.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const tabCls = (tabKey: string) =>
    `flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${tab === tabKey ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-200"}`;
  const inputCls = "w-full bg-[#0f0f17] border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="keyboard-safe-scroll keyboard-safe-form w-full max-w-lg rounded-2xl rounded-b-none bg-[#1a1a2e] p-6 shadow-2xl sm:rounded-b-2xl"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - min(var(--tinytale-keyboard-inset, 0px), 16rem) - 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-5">{isEdit ? t.paymentModal.editTitle : t.paymentModal.addTitle}</h2>

        <div className="flex gap-1 bg-[#0f0f17] rounded-lg p-1 mb-5">
          <button onClick={() => setTab("paypal")} className={tabCls("paypal")}>{t.typeLabels.paypal}</button>
          <button onClick={() => setTab("bank_transfer")} className={tabCls("bank_transfer")}>{t.typeLabels.bankTransfer}</button>
          <button onClick={() => setTab("usdt")} className={tabCls("usdt")}>{t.typeLabels.usdt}</button>
        </div>

        <div className="space-y-3">
          {tab === "paypal" && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.paypalEmail}</label>
              <input value={form.paypalEmail} onChange={(e) => set("paypalEmail", e.target.value)} placeholder={t.paymentModal.placeholders.paypal} className={inputCls} />
            </div>
          )}

          {tab === "bank_transfer" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.bankName}</label>
                <input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder={t.paymentModal.placeholders.bankName} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.accountNumber}</label>
                <input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder={t.paymentModal.placeholders.accountNumber} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.accountHolderName}</label>
                <input value={form.accountHolderName} onChange={(e) => set("accountHolderName", e.target.value)} placeholder={t.paymentModal.placeholders.accountHolderName} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.routingNumber}</label>
                <input value={form.routingNumber} onChange={(e) => set("routingNumber", e.target.value)} placeholder={t.paymentModal.placeholders.routingNumber} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.bankAddress}</label>
                <input value={form.bankAddress} onChange={(e) => set("bankAddress", e.target.value)} placeholder={t.paymentModal.placeholders.bankAddress} className={inputCls} />
              </div>
            </>
          )}

          {tab === "usdt" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.usdtAddress}</label>
                <input value={form.usdtAddress} onChange={(e) => set("usdtAddress", e.target.value)} placeholder={t.paymentModal.placeholders.usdtAddress} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.paymentModal.network}</label>
                <select value={form.usdtNetwork} onChange={(e) => set("usdtNetwork", e.target.value)} className={inputCls}>
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                </select>
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#0f0f17] text-purple-600 focus:ring-purple-500" />
          <span className="text-sm text-gray-300">{t.paymentModal.setDefault}</span>
        </label>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700/50 text-gray-300 hover:bg-gray-800/50 text-sm">{t.paymentModal.cancel}</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? t.paymentModal.saving : t.paymentModal.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const { token } = useAuth();
  const confirmDialog = useConfirm();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [wPage, setWPage] = useState(1);
  const [wTotal, setWTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);
  const perPage = 10;

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashRes, wRes, mRes] = await Promise.all([
        promoterApi.getDashboard(token),
        promoterApi.getWithdrawals(token, { page: wPage, limit: perPage }),
        promoterApi.getPaymentMethods(token),
      ]);
      setDashboard(dashRes.data || dashRes);
      const wd = wRes.data || wRes;
      setWithdrawals(wd.withdrawals || wd.items || wd || []);
      setWTotal(wd.total || wd.totalPages || 0);
      setMethods((mRes.data || mRes).methods || mRes.data || mRes || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, wPage]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    const confirmed = await confirmDialog({
      title: t.page.deleteTitle,
      message: t.page.deleteConfirm,
      confirmText: t.page.deleteAction,
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await promoterApi.deletePaymentMethod(token, id);
      fetchAll();
    } catch {
      // silent
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    try {
      await promoterApi.setDefaultPaymentMethod(token, id);
      fetchAll();
    } catch {
      // silent
    }
  };

  const totalPages = Math.max(1, Math.ceil(wTotal / perPage));
  const balance = dashboard?.availableBalance ?? 0;
  const pending = dashboard?.pendingClearance ?? 0;

  return (
    <div className="min-h-screen bg-[#0f0f17] text-white p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.page.title}</h1>
        <button
          onClick={() => setShowWithdraw(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
        >
          {t.page.requestWithdrawal}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">{t.page.availableBalance}</p>
          <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">{t.page.minThreshold}</p>
          <p className="text-2xl font-bold text-gray-300">$50.00</p>
        </div>
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">{t.page.pendingClearance}</p>
          <p className="text-2xl font-bold text-yellow-400">${pending.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl mb-8">
        <div className="px-5 py-4 border-b border-gray-800/50">
          <h2 className="text-lg font-semibold">{t.page.historyTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800/50">
                {t.page.historyHeaders.map((header) => (
                  <th key={header} className="text-left px-5 py-3 font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/30 animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-4 w-20 bg-gray-700/40 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">{t.page.noWithdrawals}</td></tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                    <td className="px-5 py-3 text-gray-300">{new Date(w.createdAt).toLocaleDateString(dateLocale)}</td>
                    <td className="px-5 py-3 text-white">${w.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-400">${(w.fee ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-white">${(w.netAmount ?? w.amount - (w.fee ?? 0)).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-300">{w.method ? getTypeLabel(w.method, t) : "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[w.status] || ""}`}>
                        {t.statusLabels[w.status] || w.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800/50">
            <span className="text-sm text-gray-500">{t.page.pageOf(wPage, totalPages)}</span>
            <div className="flex gap-2">
              <button disabled={wPage <= 1} onClick={() => setWPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-700/50 text-sm text-gray-400 hover:bg-gray-800/50 disabled:opacity-30">{t.page.prev}</button>
              <button disabled={wPage >= totalPages} onClick={() => setWPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-700/50 text-sm text-gray-400 hover:bg-gray-800/50 disabled:opacity-30">{t.page.next}</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
          <h2 className="text-lg font-semibold">{t.page.paymentMethodsTitle}</h2>
          <button
            onClick={() => { setEditMethod(null); setShowPayment(true); }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            {t.page.addPaymentMethod}
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#0f0f17] rounded-xl p-4 animate-pulse">
                  <div className="h-5 w-32 bg-gray-700/40 rounded mb-3" />
                  <div className="h-4 w-48 bg-gray-700/40 rounded" />
                </div>
              ))}
            </div>
          ) : methods.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t.page.noMethods}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methods.map((m) => (
                <div key={m._id} className="bg-[#0f0f17] border border-gray-700/30 rounded-xl p-4 flex items-start gap-3">
                  <div className="mt-0.5"><TypeIcon type={m.type} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{getTypeLabel(m.type, t)}</span>
                      {m.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 font-medium">{t.typeLabels.default}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {m.type === "paypal" && maskValue(m.paypalEmail)}
                      {m.type === "bank_transfer" && `${m.bankName || ""} ****${m.accountNumber?.slice(-4) || ""}`}
                      {m.type === "usdt" && `${maskValue(m.usdtAddress)} (${m.usdtNetwork || "TRC20"})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.isDefault && (
                      <button onClick={() => handleSetDefault(m._id)} className="text-xs text-gray-500 hover:text-purple-400 px-2 py-1">{t.page.setDefault}</button>
                    )}
                    <button onClick={() => { setEditMethod(m); setShowPayment(true); }} className="text-xs text-gray-400 hover:text-white px-2 py-1">{t.page.edit}</button>
                    <button onClick={() => handleDelete(m._id)} className="text-xs text-red-400/70 hover:text-red-400 px-2 py-1">{t.page.delete}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WithdrawModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
        methods={methods}
        token={token || ""}
        onSuccess={fetchAll}
        t={t}
      />
      <EditPaymentModal
        open={showPayment}
        onClose={() => { setShowPayment(false); setEditMethod(null); }}
        method={editMethod}
        token={token || ""}
        onSuccess={fetchAll}
        t={t}
      />
    </div>
  );
}
