"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import { ALL_COUNTRIES } from "@/lib/countries";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

const countries = [...ALL_COUNTRIES].sort();

type PaymentMethod = "bank" | "trx-usdt" | "paypal";

type TermsSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type ApplyCopy = {
  pageTitle: string;
  stepText: string;
  personalInfo: string;
  fullName: string;
  fullNamePlaceholder: string;
  businessEmail: string;
  businessEmailPlaceholder: string;
  countryRegion: string;
  selectCountry: string;
  paymentConfig: string;
  paymentBank: string;
  paymentUsdt: string;
  paymentPaypal: string;
  bankName: string;
  bankNamePlaceholder: string;
  branchName: string;
  branchNamePlaceholder: string;
  accountNumber: string;
  accountNumberPlaceholder: string;
  ibanSwift: string;
  ibanSwiftPlaceholder: string;
  bankAddressHint: string;
  streetAddress: string;
  streetAddressPlaceholder: string;
  city: string;
  cityPlaceholder: string;
  state: string;
  statePlaceholder: string;
  postalCode: string;
  postalCodePlaceholder: string;
  walletAddress: string;
  walletAddressPlaceholder: string;
  paypalEmail: string;
  paypalEmailPlaceholder: string;
  promotionChannels: string;
  promotionChannelsPlaceholder: string;
  termsPrefix: string;
  termsLink: string;
  submitIdle: string;
  submitLoading: string;
  errorAgreeTerms: string;
  errorGeneric: string;
  modalTitle: string;
  modalUpdated: string;
  modalClose: string;
  modalAgree: string;
  termsSections: TermsSection[];
};

const TERMS_EN: TermsSection[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "Welcome to the TinyTale Affiliate Program (\"Program\"). By applying to and participating in this Program, you agree to be bound by these Affiliate Terms of Service.",
      "This Agreement is between you and TinyTale Inc.",
    ],
  },
  {
    title: "2. Program Enrollment",
    paragraphs: [
      "To enroll, you must submit an application through our website.",
      "We reserve the right to accept or reject any application at our sole discretion.",
      "You must be at least 18 years old and provide valid payment information.",
    ],
  },
  {
    title: "3. Commission Structure",
    paragraphs: [
      "Affiliates earn commissions from qualifying purchases made through their referral links.",
      "Current commission can be up to 50% revenue share and may be adjusted with prior notice.",
      "Commissions are calculated on net revenue after refunds, chargebacks, and taxes.",
    ],
  },
  {
    title: "4. Payment Terms",
    paragraphs: [
      "Commissions are paid monthly with a minimum payout threshold of $50 USD.",
      "Payments are processed within 15 business days after each month ends.",
      "You are responsible for tax obligations and accurate payout information.",
    ],
  },
  {
    title: "5. Affiliate Obligations",
    paragraphs: ["As an affiliate, you agree to:"],
    bullets: [
      "Promote TinyTale in a professional and ethical manner",
      "Avoid spam, unsolicited messaging, or deceptive advertising",
      "Avoid bidding on TinyTale branded paid-search keywords",
      "Avoid fake accounts or fraudulent referrals",
      "Comply with all applicable laws and disclosure requirements",
      "Clearly disclose your affiliate relationship",
      "Avoid false or misleading claims about TinyTale",
    ],
  },
  {
    title: "6. Prohibited Activities",
    paragraphs: ["The following actions are prohibited and may lead to immediate termination:"],
    bullets: [
      "Self-referrals or referring your own accounts",
      "Cookie stuffing, click fraud, or traffic manipulation",
      "Using malware/adware/extensions to generate referrals",
      "Promoting on adult, violent, or illegal websites",
      "Impersonating TinyTale or using confusingly similar branding",
      "Incentivizing users only to farm commissions",
    ],
  },
  {
    title: "7. Intellectual Property",
    paragraphs: [
      "TinyTale grants a limited, non-exclusive, revocable license to use approved promotional materials.",
      "You may not modify trademarks or create derivative branding without written consent.",
    ],
  },
  {
    title: "8. Cookie Duration & Attribution",
    paragraphs: [
      "Referral tracking uses a 30-day cookie window.",
      "When multiple affiliates refer the same user, last-click attribution applies.",
    ],
  },
  {
    title: "9. Termination",
    paragraphs: [
      "Either party may terminate this agreement with written notice.",
      "TinyTale may terminate immediately for violations.",
      "Eligible unpaid commissions may be settled after termination; fraudulent commissions are forfeited.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    paragraphs: [
      "TinyTale is not liable for indirect, incidental, or consequential damages.",
      "Total liability is limited to commissions paid in the 12 months prior to a claim.",
    ],
  },
  {
    title: "11. Modifications",
    paragraphs: [
      "TinyTale may modify these terms with prior notice.",
      "Continued participation after the effective date constitutes acceptance.",
    ],
  },
  {
    title: "12. Governing Law",
    paragraphs: [
      "This agreement is governed by California law.",
      "Disputes may be resolved by binding arbitration in San Francisco, California.",
    ],
  },
];

const TERMS_ZH: TermsSection[] = [
  {
    title: "1. 介绍",
    paragraphs: [
      "欢迎加入 TinyTale 推广计划。提交申请并参与本计划即表示你同意遵守本服务条款。",
      "本协议由你与 TinyTale Inc. 共同订立。",
    ],
  },
  {
    title: "2. 加入资格",
    paragraphs: [
      "你需要通过官网提交申请，我们将根据审核标准决定是否通过。",
      "申请人需年满 18 周岁，并提供真实有效的收款信息。",
    ],
  },
  {
    title: "3. 佣金规则",
    paragraphs: [
      "推广佣金根据你的专属推荐链接带来的有效付费行为计算。",
      "当前最高可达 50% 分成，平台可在提前通知后调整比例。",
      "佣金按照净收入计算，已扣除退款、拒付和相关税费。",
    ],
  },
  {
    title: "4. 结算规则",
    paragraphs: [
      "佣金按月结算，最低可提现金额为 50 美元。",
      "每个自然月结束后 15 个工作日内处理结算。",
      "你需自行承担税务责任并确保收款信息准确。",
    ],
  },
  {
    title: "5. 推广员义务",
    paragraphs: ["作为推广员，你需要："],
    bullets: [
      "以专业、合规的方式推广 TinyTale",
      "不得发送垃圾信息或进行误导性宣传",
      "不得投放 TinyTale 品牌词竞价广告",
      "不得制造虚假账号或欺诈推荐",
      "遵守适用法律法规及信息披露要求",
      "清晰披露你的推广员身份",
      "不得对产品服务作虚假承诺",
    ],
  },
  {
    title: "6. 禁止行为",
    paragraphs: ["以下行为将导致立即终止合作："],
    bullets: [
      "自买自推、推荐本人账号",
      "Cookie stuffing、点击欺诈、流量作弊",
      "使用恶意软件或插件制造假推荐",
      "在成人、暴力或违法站点投放推广",
      "冒充 TinyTale 或使用混淆性品牌",
      "仅为薅佣金而诱导无效注册",
    ],
  },
  {
    title: "7. 知识产权",
    paragraphs: [
      "你可在授权范围内使用官方提供的推广素材。",
      "未经书面许可，不得擅自修改商标或二次创作品牌素材。",
    ],
  },
  {
    title: "8. 追踪归因",
    paragraphs: [
      "推荐追踪默认 30 天 Cookie 窗口。",
      "同一用户被多位推广员触达时，默认采用最后点击归因。",
    ],
  },
  {
    title: "9. 协议终止",
    paragraphs: [
      "任一方可在书面通知后终止合作。",
      "若出现违规行为，平台有权立即终止。",
      "合法产生的待结算佣金可在终止后结算，违规佣金将被取消。",
    ],
  },
  {
    title: "10. 责任限制",
    paragraphs: [
      "平台不对间接、附带或后果性损失承担责任。",
      "平台总责任上限不超过争议发生前 12 个月内已向你支付的佣金总额。",
    ],
  },
  {
    title: "11. 条款变更",
    paragraphs: [
      "平台可根据业务需要调整条款并提前通知。",
      "变更生效后继续参与计划即视为你接受新条款。",
    ],
  },
  {
    title: "12. 适用法律",
    paragraphs: [
      "本协议适用美国加利福尼亚州法律。",
      "争议可通过在旧金山进行的仲裁程序解决。",
    ],
  },
];

const TERMS_JA: TermsSection[] = [
  { title: "1. はじめに", paragraphs: ["TinyTaleアフィリエイトプログラムへようこそ。本プログラムへの申請・参加により、本規約に同意したものとみなされます。"] },
  { title: "2. 参加資格", paragraphs: ["参加には申請審査が必要です。18歳以上で、正確な支払い情報を提供する必要があります。"] },
  { title: "3. 報酬体系", paragraphs: ["紹介リンク経由の有効課金に対して報酬が発生します。報酬率は事前通知のうえ調整される場合があります。"] },
  { title: "4. 支払い条件", paragraphs: ["報酬は月次で精算され、最低出金額は50米ドルです。税務上の義務は各自の責任となります。"] },
  { title: "5. アフィリエイトの義務", paragraphs: ["法令と開示ルールを守り、誠実かつ適切な方法でTinyTaleを紹介してください。"] },
  { title: "6. 禁止事項", paragraphs: ["不正トラフィック、自己紹介、なりすまし、誤認を招く宣伝などは禁止されます。"] },
  { title: "7. 知的財産", paragraphs: ["公式素材は許可範囲内で使用できます。商標の改変や無断の二次利用は禁止です。"] },
  { title: "8. 計測と帰属", paragraphs: ["紹介計測は30日Cookieで行われます。複数紹介時は原則ラストクリック帰属です。"] },
  { title: "9. 契約終了", paragraphs: ["双方は通知により終了できます。規約違反がある場合、即時終了されることがあります。"] },
  { title: "10. 責任の制限", paragraphs: ["TinyTaleは間接損害等について責任を負いません。責任上限は過去12か月の支払報酬総額です。"] },
  { title: "11. 規約変更", paragraphs: ["規約は予告の上で変更される場合があります。継続利用は変更後規約への同意とみなされます。"] },
  { title: "12. 準拠法", paragraphs: ["本規約は米国カリフォルニア州法に準拠し、紛争は同地での手続きにより解決されます。"] },
];

const TERMS_ES: TermsSection[] = [
  { title: "1. Introducción", paragraphs: ["Al solicitar y participar en el programa de afiliados de TinyTale, aceptas estos términos de servicio."] },
  { title: "2. Elegibilidad", paragraphs: ["La participación requiere aprobación. Debes tener al menos 18 años y proporcionar datos de pago válidos."] },
  { title: "3. Estructura de comisiones", paragraphs: ["Las comisiones se generan por compras válidas realizadas mediante tu enlace de referido. La tasa puede ajustarse con aviso previo."] },
  { title: "4. Pagos", paragraphs: ["Las comisiones se liquidan mensualmente con un mínimo de retiro de 50 USD. Las obligaciones fiscales son responsabilidad del afiliado."] },
  { title: "5. Obligaciones del afiliado", paragraphs: ["Debes promocionar TinyTale de forma ética, legal y transparente, incluyendo la divulgación de tu relación de afiliado."] },
  { title: "6. Actividades prohibidas", paragraphs: ["Se prohíben el fraude, autorreferencias, suplantación de marca y cualquier método engañoso de captación."] },
  { title: "7. Propiedad intelectual", paragraphs: ["Solo puedes usar materiales oficiales aprobados; está prohibido modificar marcas sin autorización."] },
  { title: "8. Atribución y cookies", paragraphs: ["Se utiliza una ventana de cookie de 30 días y, en general, atribución por último clic."] },
  { title: "9. Terminación", paragraphs: ["Cualquiera de las partes puede finalizar la relación; TinyTale puede terminarla de inmediato ante incumplimientos."] },
  { title: "10. Limitación de responsabilidad", paragraphs: ["TinyTale no responde por daños indirectos; la responsabilidad máxima se limita a comisiones pagadas en los últimos 12 meses."] },
  { title: "11. Modificaciones", paragraphs: ["Los términos pueden actualizarse con aviso previo; continuar en el programa implica aceptación."] },
  { title: "12. Ley aplicable", paragraphs: ["Este acuerdo se rige por las leyes de California, Estados Unidos."] },
];

const TERMS_PT: TermsSection[] = [
  { title: "1. Introdução", paragraphs: ["Ao se candidatar e participar do programa de afiliados da TinyTale, você concorda com estes termos."] },
  { title: "2. Elegibilidade", paragraphs: ["A participação depende de aprovação. É necessário ter 18+ anos e fornecer dados de pagamento válidos."] },
  { title: "3. Estrutura de comissão", paragraphs: ["Comissões são geradas por compras válidas via seu link de indicação. A taxa pode ser ajustada com aviso prévio."] },
  { title: "4. Pagamentos", paragraphs: ["As comissões são pagas mensalmente com saque mínimo de US$ 50. Obrigações fiscais são de responsabilidade do afiliado."] },
  { title: "5. Obrigações do afiliado", paragraphs: ["Você deve promover a TinyTale de forma ética, legal e transparente, com divulgação da relação de afiliado."] },
  { title: "6. Atividades proibidas", paragraphs: ["Fraude, autoindicação, falsidade de marca e métodos enganosos de aquisição são proibidos."] },
  { title: "7. Propriedade intelectual", paragraphs: ["Somente materiais oficiais aprovados podem ser usados; não modifique marcas sem autorização."] },
  { title: "8. Atribuição e cookie", paragraphs: ["A janela de cookie é de 30 dias e a atribuição padrão é de último clique."] },
  { title: "9. Rescisão", paragraphs: ["Qualquer parte pode encerrar a parceria; a TinyTale pode encerrar imediatamente em caso de violação."] },
  { title: "10. Limitação de responsabilidade", paragraphs: ["A TinyTale não se responsabiliza por danos indiretos; o limite total é o valor pago em comissão nos últimos 12 meses."] },
  { title: "11. Alterações", paragraphs: ["Os termos podem ser atualizados com aviso prévio; continuar no programa implica aceitação."] },
  { title: "12. Lei aplicável", paragraphs: ["Este acordo é regido pelas leis da Califórnia, Estados Unidos."] },
];

const TERMS_HI: TermsSection[] = [
  { title: "1. परिचय", paragraphs: ["TinyTale अफिलिएट प्रोग्राम में आवेदन और भागीदारी करके आप इन शर्तों से सहमत होते हैं।"] },
  { title: "2. पात्रता", paragraphs: ["प्रोग्राम में शामिल होने के लिए अनुमोदन आवश्यक है। आपकी आयु 18+ होनी चाहिए और वैध भुगतान जानकारी देनी होगी।"] },
  { title: "3. कमीशन संरचना", paragraphs: ["आपके रेफरल लिंक से हुई वैध खरीद पर कमीशन मिलेगा। कमीशन दर पूर्व सूचना के साथ बदली जा सकती है।"] },
  { title: "4. भुगतान नियम", paragraphs: ["कमीशन मासिक सेटल होता है, न्यूनतम निकासी 50 USD है। कर संबंधी जिम्मेदारी आपकी होगी।"] },
  { title: "5. अफिलिएट दायित्व", paragraphs: ["प्रचार नैतिक, कानूनी और पारदर्शी तरीके से करें तथा अपनी अफिलिएट साझेदारी स्पष्ट रूप से बताएं।"] },
  { title: "6. निषिद्ध गतिविधियाँ", paragraphs: ["फ्रॉड, सेल्फ-रेफरल, ब्रांड इम्परसनेशन और भ्रामक ट्रैफिक तरीकों की अनुमति नहीं है।"] },
  { title: "7. बौद्धिक संपदा", paragraphs: ["केवल स्वीकृत आधिकारिक सामग्री का उपयोग करें; ट्रेडमार्क में बिना अनुमति बदलाव न करें।"] },
  { title: "8. एट्रिब्यूशन व कुकी", paragraphs: ["ट्रैकिंग विंडो 30 दिनों की है और सामान्यतः last-click attribution लागू होता है।"] },
  { title: "9. समाप्ति", paragraphs: ["दोनों पक्ष साझेदारी समाप्त कर सकते हैं; उल्लंघन होने पर TinyTale तत्काल समाप्ति कर सकता है।"] },
  { title: "10. दायित्व सीमा", paragraphs: ["TinyTale अप्रत्यक्ष नुकसान के लिए जिम्मेदार नहीं होगा; अधिकतम दायित्व पिछले 12 महीनों की भुगतान कमीशन राशि तक सीमित है।"] },
  { title: "11. संशोधन", paragraphs: ["शर्तें पूर्व सूचना के साथ बदली जा सकती हैं; जारी भागीदारी नई शर्तों की स्वीकृति मानी जाएगी।"] },
  { title: "12. लागू कानून", paragraphs: ["यह समझौता कैलिफोर्निया (अमेरिका) के कानूनों के अधीन होगा।"] },
];

const TERMS_ID: TermsSection[] = [
  { title: "1. Pendahuluan", paragraphs: ["Dengan mendaftar dan mengikuti program afiliasi TinyTale, Anda menyetujui ketentuan layanan ini."] },
  { title: "2. Kelayakan", paragraphs: ["Partisipasi memerlukan persetujuan. Anda harus berusia 18+ dan memberikan data pembayaran yang valid."] },
  { title: "3. Struktur komisi", paragraphs: ["Komisi diberikan atas pembelian valid melalui tautan referral Anda. Besaran komisi dapat diperbarui dengan pemberitahuan sebelumnya."] },
  { title: "4. Ketentuan pembayaran", paragraphs: ["Komisi dibayarkan bulanan dengan minimum penarikan USD 50. Kewajiban pajak menjadi tanggung jawab afiliasi."] },
  { title: "5. Kewajiban afiliasi", paragraphs: ["Promosikan TinyTale secara etis, legal, dan transparan, termasuk mengungkapkan hubungan afiliasi Anda."] },
  { title: "6. Aktivitas terlarang", paragraphs: ["Penipuan, self-referral, penyamaran merek, dan metode traffic menyesatkan dilarang."] },
  { title: "7. Hak kekayaan intelektual", paragraphs: ["Gunakan hanya materi resmi yang disetujui; dilarang memodifikasi merek tanpa izin."] },
  { title: "8. Atribusi & cookie", paragraphs: ["Tracking menggunakan cookie 30 hari dan umumnya last-click attribution."] },
  { title: "9. Pengakhiran", paragraphs: ["Kedua pihak dapat mengakhiri kerja sama; TinyTale dapat menghentikan segera jika terjadi pelanggaran."] },
  { title: "10. Batas tanggung jawab", paragraphs: ["TinyTale tidak bertanggung jawab atas kerugian tidak langsung; batas tanggung jawab maksimal adalah komisi 12 bulan terakhir."] },
  { title: "11. Perubahan ketentuan", paragraphs: ["Ketentuan dapat diperbarui dengan pemberitahuan sebelumnya; partisipasi berlanjut berarti menyetujui perubahan."] },
  { title: "12. Hukum yang berlaku", paragraphs: ["Perjanjian ini tunduk pada hukum California, Amerika Serikat."] },
];

const COPY_EN: ApplyCopy = {
  pageTitle: "Apply for Affiliate Program",
  stepText: "Step 2 of 4 — 50%",
  personalInfo: "Personal Information",
  fullName: "Full Legal Name",
  fullNamePlaceholder: "John Doe",
  businessEmail: "Business Email",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "Country / Region",
  selectCountry: "Select your country",
  paymentConfig: "Payment Configuration",
  paymentBank: "Bank Transfer",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "Bank Name",
  bankNamePlaceholder: "e.g. Chase Bank, HSBC",
  branchName: "Branch Name",
  branchNamePlaceholder: "e.g. Main Street Branch",
  accountNumber: "Account Number",
  accountNumberPlaceholder: "Enter your account number",
  ibanSwift: "IBAN / SWIFT Code",
  ibanSwiftPlaceholder: "e.g. CHASUS33 or GB29NWBK...",
  bankAddressHint: "Personal Address (for bank verification)",
  streetAddress: "Street Address",
  streetAddressPlaceholder: "123 Main Street, Apt 4B",
  city: "City",
  cityPlaceholder: "City",
  state: "State / Province",
  statePlaceholder: "State",
  postalCode: "Postal Code",
  postalCodePlaceholder: "Zip / Postal",
  walletAddress: "USDT Wallet Address",
  walletAddressPlaceholder: "Enter your TRC-20 wallet address",
  paypalEmail: "PayPal Email",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "Promotion Channels",
  promotionChannelsPlaceholder: "Describe how you plan to promote (e.g. YouTube, blog, social media, email list...)",
  termsPrefix: "I agree to the",
  termsLink: "Affiliate Terms of Service",
  submitIdle: "Submit Application",
  submitLoading: "Submitting...",
  errorAgreeTerms: "You must agree to the Affiliate Terms of Service.",
  errorGeneric: "Something went wrong. Please try again.",
  modalTitle: "Affiliate Program Terms of Service",
  modalUpdated: "Last Updated: February 2026",
  modalClose: "Close",
  modalAgree: "I Agree",
  termsSections: TERMS_EN,
};

const COPY_ZH: ApplyCopy = {
  pageTitle: "申请加入推广计划",
  stepText: "第 2 / 4 步 — 50%",
  personalInfo: "个人信息",
  fullName: "法定姓名",
  fullNamePlaceholder: "张三",
  businessEmail: "商务邮箱",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "国家 / 地区",
  selectCountry: "请选择国家",
  paymentConfig: "收款配置",
  paymentBank: "银行转账",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "银行名称",
  bankNamePlaceholder: "如：中国银行、汇丰银行",
  branchName: "支行名称",
  branchNamePlaceholder: "如：陆家嘴支行",
  accountNumber: "银行账号",
  accountNumberPlaceholder: "请输入账号",
  ibanSwift: "IBAN / SWIFT 代码",
  ibanSwiftPlaceholder: "如：CHASUS33 或 GB29NWBK...",
  bankAddressHint: "开户地址（用于银行验证）",
  streetAddress: "街道地址",
  streetAddressPlaceholder: "XX 路 XX 号",
  city: "城市",
  cityPlaceholder: "城市",
  state: "省 / 州",
  statePlaceholder: "省份",
  postalCode: "邮编",
  postalCodePlaceholder: "邮编",
  walletAddress: "USDT 钱包地址",
  walletAddressPlaceholder: "请输入 TRC-20 钱包地址",
  paypalEmail: "PayPal 邮箱",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "推广渠道",
  promotionChannelsPlaceholder: "请说明你的推广方式（如 YouTube、博客、社交媒体、邮件列表等）",
  termsPrefix: "我已阅读并同意",
  termsLink: "推广服务条款",
  submitIdle: "提交申请",
  submitLoading: "提交中...",
  errorAgreeTerms: "你必须同意推广服务条款后才能提交。",
  errorGeneric: "提交失败，请稍后重试。",
  modalTitle: "推广计划服务条款",
  modalUpdated: "最后更新：2026 年 2 月",
  modalClose: "关闭",
  modalAgree: "同意",
  termsSections: TERMS_ZH,
};

const COPY_JA: ApplyCopy = {
  ...COPY_EN,
  pageTitle: "アフィリエイト申請",
  stepText: "ステップ 2 / 4 — 50%",
  personalInfo: "個人情報",
  fullName: "氏名（法的表記）",
  fullNamePlaceholder: "山田 太郎",
  businessEmail: "ビジネスメール",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "国 / 地域",
  selectCountry: "国を選択してください",
  paymentConfig: "受取設定",
  paymentBank: "銀行振込",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "銀行名",
  bankNamePlaceholder: "例：Mitsubishi UFJ",
  branchName: "支店名",
  branchNamePlaceholder: "例：Shibuya Branch",
  accountNumber: "口座番号",
  accountNumberPlaceholder: "口座番号を入力",
  ibanSwift: "IBAN / SWIFT コード",
  ibanSwiftPlaceholder: "例：CHASUS33 / GB29NWBK...",
  bankAddressHint: "住所情報（銀行確認用）",
  streetAddress: "住所",
  streetAddressPlaceholder: "東京都〇〇区...",
  city: "市区町村",
  cityPlaceholder: "東京",
  state: "都道府県",
  statePlaceholder: "都道府県",
  postalCode: "郵便番号",
  postalCodePlaceholder: "郵便番号",
  walletAddress: "USDTウォレットアドレス",
  walletAddressPlaceholder: "TRC-20ウォレットアドレスを入力",
  paypalEmail: "PayPalメール",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "プロモーションチャネル",
  promotionChannelsPlaceholder: "プロモーション方法（YouTube、ブログ、SNS、メールリスト等）を記入してください",
  termsPrefix: "以下に同意します：",
  termsLink: "アフィリエイト利用規約",
  submitIdle: "申請を送信",
  submitLoading: "送信中...",
  errorAgreeTerms: "申請には利用規約への同意が必要です。",
  errorGeneric: "問題が発生しました。しばらくしてから再試行してください。",
  modalTitle: "アフィリエイトプログラム利用規約",
  modalUpdated: "最終更新: 2026年2月",
  modalClose: "閉じる",
  modalAgree: "同意する",
  termsSections: TERMS_JA,
};

const COPY_ES: ApplyCopy = {
  ...COPY_EN,
  pageTitle: "Solicitud de afiliado",
  stepText: "Paso 2 de 4 — 50%",
  personalInfo: "Información personal",
  fullName: "Nombre legal completo",
  fullNamePlaceholder: "Juan Pérez",
  businessEmail: "Correo de negocio",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "País / Región",
  selectCountry: "Selecciona tu país",
  paymentConfig: "Configuración de pago",
  paymentBank: "Transferencia bancaria",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "Nombre del banco",
  bankNamePlaceholder: "ej. BBVA, Santander",
  branchName: "Sucursal",
  branchNamePlaceholder: "ej. Sucursal Centro",
  accountNumber: "Número de cuenta",
  accountNumberPlaceholder: "Ingresa tu número de cuenta",
  ibanSwift: "Código IBAN / SWIFT",
  ibanSwiftPlaceholder: "ej. CHASUS33 o GB29NWBK...",
  bankAddressHint: "Dirección personal (verificación bancaria)",
  streetAddress: "Dirección",
  streetAddressPlaceholder: "Calle principal 123",
  city: "Ciudad",
  cityPlaceholder: "Ciudad",
  state: "Estado / Provincia",
  statePlaceholder: "Estado",
  postalCode: "Código postal",
  postalCodePlaceholder: "Código postal",
  walletAddress: "Dirección de billetera USDT",
  walletAddressPlaceholder: "Ingresa tu dirección TRC-20",
  paypalEmail: "Correo PayPal",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "Canales de promoción",
  promotionChannelsPlaceholder: "Describe cómo promocionarás (YouTube, blog, redes sociales, email, etc.)",
  termsPrefix: "Acepto los",
  termsLink: "Términos del programa de afiliados",
  submitIdle: "Enviar solicitud",
  submitLoading: "Enviando...",
  errorAgreeTerms: "Debes aceptar los términos del programa de afiliados.",
  errorGeneric: "Algo salió mal. Inténtalo nuevamente.",
  modalTitle: "Términos del programa de afiliados",
  modalUpdated: "Última actualización: febrero de 2026",
  modalClose: "Cerrar",
  modalAgree: "Acepto",
  termsSections: TERMS_ES,
};

const COPY_PT: ApplyCopy = {
  ...COPY_EN,
  pageTitle: "Solicitação de afiliado",
  stepText: "Etapa 2 de 4 — 50%",
  personalInfo: "Informações pessoais",
  fullName: "Nome legal completo",
  fullNamePlaceholder: "João Silva",
  businessEmail: "E-mail comercial",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "País / Região",
  selectCountry: "Selecione seu país",
  paymentConfig: "Configuração de pagamento",
  paymentBank: "Transferência bancária",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "Nome do banco",
  bankNamePlaceholder: "ex.: Banco do Brasil, Itaú",
  branchName: "Agência",
  branchNamePlaceholder: "ex.: Agência Centro",
  accountNumber: "Número da conta",
  accountNumberPlaceholder: "Digite seu número de conta",
  ibanSwift: "Código IBAN / SWIFT",
  ibanSwiftPlaceholder: "ex.: CHASUS33 ou GB29NWBK...",
  bankAddressHint: "Endereço pessoal (verificação bancária)",
  streetAddress: "Endereço",
  streetAddressPlaceholder: "Rua principal, 123",
  city: "Cidade",
  cityPlaceholder: "Cidade",
  state: "Estado / Província",
  statePlaceholder: "Estado",
  postalCode: "CEP",
  postalCodePlaceholder: "CEP",
  walletAddress: "Endereço da carteira USDT",
  walletAddressPlaceholder: "Digite seu endereço TRC-20",
  paypalEmail: "E-mail PayPal",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "Canais de promoção",
  promotionChannelsPlaceholder: "Descreva como você vai promover (YouTube, blog, redes sociais, e-mail etc.)",
  termsPrefix: "Concordo com os",
  termsLink: "Termos do programa de afiliados",
  submitIdle: "Enviar solicitação",
  submitLoading: "Enviando...",
  errorAgreeTerms: "Você precisa concordar com os termos do programa de afiliados.",
  errorGeneric: "Algo deu errado. Tente novamente.",
  modalTitle: "Termos do programa de afiliados",
  modalUpdated: "Última atualização: fevereiro de 2026",
  modalClose: "Fechar",
  modalAgree: "Concordo",
  termsSections: TERMS_PT,
};

const COPY_HI: ApplyCopy = {
  ...COPY_EN,
  pageTitle: "अफिलिएट आवेदन",
  stepText: "चरण 2 / 4 — 50%",
  personalInfo: "व्यक्तिगत जानकारी",
  fullName: "पूरा कानूनी नाम",
  fullNamePlaceholder: "राहुल शर्मा",
  businessEmail: "बिज़नेस ईमेल",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "देश / क्षेत्र",
  selectCountry: "अपना देश चुनें",
  paymentConfig: "भुगतान कॉन्फ़िगरेशन",
  paymentBank: "बैंक ट्रांसफर",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "बैंक का नाम",
  bankNamePlaceholder: "जैसे: HDFC, SBI",
  branchName: "ब्रांच नाम",
  branchNamePlaceholder: "जैसे: मेन ब्रांच",
  accountNumber: "खाता संख्या",
  accountNumberPlaceholder: "अपना खाता नंबर दर्ज करें",
  ibanSwift: "IBAN / SWIFT कोड",
  ibanSwiftPlaceholder: "जैसे: CHASUS33 या GB29NWBK...",
  bankAddressHint: "व्यक्तिगत पता (बैंक सत्यापन हेतु)",
  streetAddress: "स्ट्रीट एड्रेस",
  streetAddressPlaceholder: "123 मेन स्ट्रीट",
  city: "शहर",
  cityPlaceholder: "शहर",
  state: "राज्य / प्रांत",
  statePlaceholder: "राज्य",
  postalCode: "पिन / पोस्टल कोड",
  postalCodePlaceholder: "पिन कोड",
  walletAddress: "USDT वॉलेट एड्रेस",
  walletAddressPlaceholder: "अपना TRC-20 वॉलेट एड्रेस दर्ज करें",
  paypalEmail: "PayPal ईमेल",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "प्रमोशन चैनल",
  promotionChannelsPlaceholder: "आप कैसे प्रचार करेंगे लिखें (YouTube, ब्लॉग, सोशल मीडिया, ईमेल सूची आदि)",
  termsPrefix: "मैं सहमत हूँ:",
  termsLink: "अफिलिएट सेवा शर्तें",
  submitIdle: "आवेदन जमा करें",
  submitLoading: "जमा किया जा रहा है...",
  errorAgreeTerms: "आवेदन जमा करने से पहले शर्तों से सहमत होना आवश्यक है।",
  errorGeneric: "कुछ गलत हुआ। कृपया फिर से प्रयास करें।",
  modalTitle: "अफिलिएट प्रोग्राम सेवा शर्तें",
  modalUpdated: "अंतिम अपडेट: फरवरी 2026",
  modalClose: "बंद करें",
  modalAgree: "मैं सहमत हूँ",
  termsSections: TERMS_HI,
};

const COPY_ID: ApplyCopy = {
  ...COPY_EN,
  pageTitle: "Pengajuan afiliasi",
  stepText: "Langkah 2 dari 4 — 50%",
  personalInfo: "Informasi pribadi",
  fullName: "Nama legal lengkap",
  fullNamePlaceholder: "Budi Santoso",
  businessEmail: "Email bisnis",
  businessEmailPlaceholder: "you@company.com",
  countryRegion: "Negara / Wilayah",
  selectCountry: "Pilih negara",
  paymentConfig: "Konfigurasi pembayaran",
  paymentBank: "Transfer bank",
  paymentUsdt: "TRX-USDT",
  paymentPaypal: "PayPal",
  bankName: "Nama bank",
  bankNamePlaceholder: "contoh: BCA, Mandiri",
  branchName: "Nama cabang",
  branchNamePlaceholder: "contoh: Cabang Pusat",
  accountNumber: "Nomor rekening",
  accountNumberPlaceholder: "Masukkan nomor rekening",
  ibanSwift: "Kode IBAN / SWIFT",
  ibanSwiftPlaceholder: "contoh: CHASUS33 atau GB29NWBK...",
  bankAddressHint: "Alamat pribadi (untuk verifikasi bank)",
  streetAddress: "Alamat jalan",
  streetAddressPlaceholder: "Jl. Merdeka No.123",
  city: "Kota",
  cityPlaceholder: "Kota",
  state: "Provinsi",
  statePlaceholder: "Provinsi",
  postalCode: "Kode pos",
  postalCodePlaceholder: "Kode pos",
  walletAddress: "Alamat dompet USDT",
  walletAddressPlaceholder: "Masukkan alamat dompet TRC-20",
  paypalEmail: "Email PayPal",
  paypalEmailPlaceholder: "your@paypal.com",
  promotionChannels: "Kanal promosi",
  promotionChannelsPlaceholder: "Jelaskan cara Anda mempromosikan (YouTube, blog, media sosial, email list, dll.)",
  termsPrefix: "Saya menyetujui",
  termsLink: "Ketentuan layanan afiliasi",
  submitIdle: "Kirim pengajuan",
  submitLoading: "Mengirim...",
  errorAgreeTerms: "Anda harus menyetujui ketentuan layanan afiliasi.",
  errorGeneric: "Terjadi kesalahan. Silakan coba lagi.",
  modalTitle: "Ketentuan layanan program afiliasi",
  modalUpdated: "Terakhir diperbarui: Februari 2026",
  modalClose: "Tutup",
  modalAgree: "Saya setuju",
  termsSections: TERMS_ID,
};

const COPY_BY_LOCALE: Record<SupportedLocale, ApplyCopy> = {
  en: COPY_EN,
  zh: COPY_ZH,
  ja: COPY_JA,
  es: COPY_ES,
  pt: COPY_PT,
  hi: COPY_HI,
  id: COPY_ID,
};

export default function AffiliateApplyPage() {
  const locale = useLocale();
  const t = COPY_BY_LOCALE[locale] || COPY_EN;
  const router = useRouter();
  const { token } = useAuth();

  const [fullName, setFullName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ibanSwiftCode, setIbanSwiftCode] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [bankCity, setBankCity] = useState("");
  const [bankState, setBankState] = useState("");
  const [bankPostalCode, setBankPostalCode] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [promotionChannels, setPromotionChannels] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const charLimit = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError(t.errorAgreeTerms);
      return;
    }
    if (!token) {
      router.push(`${localizePath("/auth/login", locale)}?redirect=${encodeURIComponent(localizePath("/affiliate/apply", locale))}`);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const paymentInfo: any = { method: paymentMethod };
      if (paymentMethod === "bank") {
        paymentInfo.bankName = bankName;
        paymentInfo.branchName = branchName;
        paymentInfo.accountNumber = accountNumber;
        paymentInfo.ibanSwiftCode = ibanSwiftCode;
        paymentInfo.address = bankAddress;
        paymentInfo.city = bankCity;
        paymentInfo.state = bankState;
        paymentInfo.postalCode = bankPostalCode;
      } else if (paymentMethod === "trx-usdt") {
        paymentInfo.walletAddress = walletAddress;
      } else if (paymentMethod === "paypal") {
        paymentInfo.paypalEmail = paypalEmail;
      }

      await promoterApi.apply(token, {
        fullName,
        businessEmail,
        country,
        promotionChannels,
        paymentMethod: paymentInfo,
      });
      router.push(localizePath("/affiliate/pending", locale));
    } catch (err: any) {
      const msg = err?.message || t.errorGeneric;
      if (msg.toLowerCase().includes("invalid token") || msg.toLowerCase().includes("no token")) {
        router.push(`${localizePath("/auth/login", locale)}?redirect=${encodeURIComponent(localizePath("/affiliate/apply", locale))}`);
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg bg-[#1a1a2e] border border-gray-700/50 text-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t.pageTitle}</h1>

        <div className="mb-10">
          <p className="text-sm text-gray-400 text-center mb-2">{t.stepText}</p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all" style={{ width: "50%" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white mb-1">{t.personalInfo}</h2>

            <div>
              <label className={labelClass}>{t.fullName}</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t.fullNamePlaceholder} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>{t.businessEmail}</label>
              <input type="email" required value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder={t.businessEmailPlaceholder} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>{t.countryRegion}</label>
              <select required value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass + " appearance-none cursor-pointer"}>
                <option value="" disabled>{t.selectCountry}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white mb-1">{t.paymentConfig}</h2>

            <div className="flex flex-wrap gap-4">
              {([
                { value: "bank", label: t.paymentBank },
                { value: "trx-usdt", label: t.paymentUsdt },
                { value: "paypal", label: t.paymentPaypal },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 transition ${
                    paymentMethod === opt.value
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-gray-700/50 bg-[#1a1a2e] text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="accent-purple-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {paymentMethod === "bank" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t.bankName}</label>
                    <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t.bankNamePlaceholder} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t.branchName}</label>
                    <input type="text" required value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder={t.branchNamePlaceholder} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t.accountNumber}</label>
                    <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={t.accountNumberPlaceholder} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t.ibanSwift}</label>
                    <input type="text" required value={ibanSwiftCode} onChange={(e) => setIbanSwiftCode(e.target.value)} placeholder={t.ibanSwiftPlaceholder} className={inputClass} />
                  </div>
                </div>

                <p className="text-xs text-gray-500 -mt-1">{t.bankAddressHint}</p>

                <div>
                  <label className={labelClass}>{t.streetAddress}</label>
                  <input type="text" required value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} placeholder={t.streetAddressPlaceholder} className={inputClass} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>{t.city}</label>
                    <input type="text" required value={bankCity} onChange={(e) => setBankCity(e.target.value)} placeholder={t.cityPlaceholder} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t.state}</label>
                    <input type="text" required value={bankState} onChange={(e) => setBankState(e.target.value)} placeholder={t.statePlaceholder} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t.postalCode}</label>
                    <input type="text" required value={bankPostalCode} onChange={(e) => setBankPostalCode(e.target.value)} placeholder={t.postalCodePlaceholder} className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "trx-usdt" && (
              <div>
                <label className={labelClass}>{t.walletAddress}</label>
                <input type="text" required value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder={t.walletAddressPlaceholder} className={inputClass} />
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div>
                <label className={labelClass}>{t.paypalEmail}</label>
                <input type="email" required value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder={t.paypalEmailPlaceholder} className={inputClass} />
              </div>
            )}
          </div>

          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-1">{t.promotionChannels}</h2>
            <textarea
              required
              maxLength={charLimit}
              rows={4}
              value={promotionChannels}
              onChange={(e) => setPromotionChannels(e.target.value)}
              placeholder={t.promotionChannelsPlaceholder}
              className={inputClass + " resize-none"}
            />
            <p className="text-xs text-gray-500 text-right">{promotionChannels.length}/{charLimit}</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 accent-purple-500 rounded"
            />
            <span className="text-sm text-gray-400">
              {t.termsPrefix}{" "}
              <button type="button" onClick={() => setShowTermsModal(true)} className="text-purple-400 underline hover:text-purple-300">
                {t.termsLink}
              </button>
            </span>
          </label>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t.submitLoading : t.submitIdle}
          </button>
        </form>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#13131d] border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">{t.modalTitle}</h2>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-white transition text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-300 leading-relaxed flex-1">
              <p className="text-xs text-gray-500">{t.modalUpdated}</p>

              {t.termsSections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-white font-semibold mb-2">{section.title}</h3>
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={`${section.title}-${index}`}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700/50 hover:border-gray-600 transition"
              >
                {t.modalClose}
              </button>
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition"
              >
                {t.modalAgree}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
