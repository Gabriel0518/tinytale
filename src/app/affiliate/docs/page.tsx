"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

type Section = {
  title: string;
  points: string[];
};

type DocsCopy = {
  pageTitle: string;
  pageDesc: string;
  updatedAt: string;
  sections: Section[];
  noticeTitle: string;
  noticeBody: string;
  backToAffiliate: string;
};

const COPY: FlexibleRecord<SupportedLocale, DocsCopy> = {
  en: {
    pageTitle: "Affiliate Program Documentation",
    pageDesc: "Read the latest terms, commission policy, settlement rules, and update process before promotion.",
    updatedAt: "Last updated: 2026-03-10",
    sections: [
      {
        title: "Program Terms",
        points: [
          "Applicants must provide complete and accurate profile information.",
          "Any fake traffic, fraud, or policy abuse may result in account suspension.",
          "TinyTale may update program terms for compliance and operational needs.",
        ],
      },
      {
        title: "Commission Structure",
        points: [
          "Commission is calculated based on eligible completed orders from referred users.",
          "Rate tiers are managed by admin settings and may vary by promoter level.",
          "Canceled, refunded, or invalid transactions are excluded from commission.",
        ],
      },
      {
        title: "Settlement Rules",
        points: [
          "Withdrawal requests follow minimum threshold and platform fee rules.",
          "Commissions may remain in pending status during validation and freeze period.",
          "Approved payouts are settled to your selected payment method after review.",
        ],
      },
      {
        title: "Information Updates",
        points: [
          "Policy updates are published here and may also be announced via community channels.",
          "Please keep your payment information and contact details up to date.",
          "For disputes, contact support with referral/order details for verification.",
        ],
      },
    ],
    noticeTitle: "Important Notice",
    noticeBody: "This page is the current reference for affiliate policy. Continued participation implies acceptance of the latest updates.",
    backToAffiliate: "Back to Affiliate",
  },
  zh: {
    pageTitle: "推广计划文档",
    pageDesc: "在开始推广前，请先阅读最新的计划条款、佣金结构、结算规则与信息更新说明。",
    updatedAt: "最后更新：2026-03-10",
    sections: [
      {
        title: "推广计划条款",
        points: [
          "申请人需提供真实、完整的身份与业务信息。",
          "如存在刷量、欺诈或违规推广行为，平台有权暂停或关闭账号。",
          "平台可基于合规与运营需要对计划条款进行更新。",
        ],
      },
      {
        title: "佣金结构",
        points: [
          "佣金基于你推荐用户产生的有效完成订单计算。",
          "佣金比例由后台配置并可能随推广等级变化。",
          "取消、退款或异常订单不计入佣金结算。",
        ],
      },
      {
        title: "结算规则",
        points: [
          "提现申请需满足最低提现门槛与平台手续费规则。",
          "佣金在校验期与冻结期内可能保持待结算状态。",
          "审核通过后，将按你设置的收款方式进行打款。",
        ],
      },
      {
        title: "信息更新",
        points: [
          "规则更新将优先发布在本页，并可能同步到社群渠道。",
          "请及时维护收款信息与联系方式，避免影响结算。",
          "如有争议，请提交推广与订单信息以便核验。",
        ],
      },
    ],
    noticeTitle: "重要说明",
    noticeBody: "本页为当前推广政策参考文档。继续参与推广即视为接受最新政策更新。",
    backToAffiliate: "返回推广首页",
  },
  ja: {
    pageTitle: "アフィリエイトプログラム資料",
    pageDesc: "プロモーション開始前に、最新の規約、報酬体系、精算ルール、更新方針をご確認ください。",
    updatedAt: "最終更新: 2026-03-10",
    sections: [
      {
        title: "プログラム規約",
        points: [
          "申請者は正確かつ完全な情報を提出する必要があります。",
          "不正トラフィックや規約違反が確認された場合、アカウント停止の対象となります。",
          "運用や法令対応のため、規約は更新される場合があります。",
        ],
      },
      {
        title: "報酬体系",
        points: [
          "報酬は紹介ユーザーの有効な完了注文を基準に計算されます。",
          "報酬率は管理設定およびプロモーターランクによって変動します。",
          "キャンセル、返金、無効取引は報酬対象外です。",
        ],
      },
      {
        title: "精算ルール",
        points: [
          "出金申請には最低金額と手数料ルールが適用されます。",
          "検証期間・凍結期間中は報酬が保留になる場合があります。",
          "承認後、登録済みの支払い方法へ送金されます。",
        ],
      },
      {
        title: "情報更新",
        points: [
          "ポリシー更新は本ページに掲載され、必要に応じてコミュニティでも通知されます。",
          "支払い情報と連絡先は常に最新にしてください。",
          "異議申し立て時は紹介・注文情報をご提出ください。",
        ],
      },
    ],
    noticeTitle: "重要なお知らせ",
    noticeBody: "本ページは最新のアフィリエイトポリシーを示します。継続利用は最新内容への同意とみなされます。",
    backToAffiliate: "アフィリエイトへ戻る",
  },
  es: {
    pageTitle: "Documentación del Programa de Afiliados",
    pageDesc: "Consulta los términos, estructura de comisiones, reglas de liquidación y actualizaciones antes de promocionar.",
    updatedAt: "Última actualización: 2026-03-10",
    sections: [
      {
        title: "Términos del programa",
        points: [
          "Los solicitantes deben proporcionar información completa y veraz.",
          "El tráfico fraudulento o abuso de políticas puede causar suspensión de cuenta.",
          "TinyTale puede actualizar términos por cumplimiento y operación.",
        ],
      },
      {
        title: "Estructura de comisiones",
        points: [
          "La comisión se calcula sobre pedidos válidos y completados de referidos.",
          "Las tasas pueden variar según configuración de admin y nivel del promotor.",
          "Pedidos cancelados, reembolsados o inválidos no generan comisión.",
        ],
      },
      {
        title: "Reglas de liquidación",
        points: [
          "Los retiros deben cumplir monto mínimo y comisiones de plataforma.",
          "Las comisiones pueden quedar pendientes durante validación y período de retención.",
          "Tras aprobación, el pago se procesa al método registrado.",
        ],
      },
      {
        title: "Actualizaciones de información",
        points: [
          "Las actualizaciones se publican aquí y pueden anunciarse en la comunidad.",
          "Mantén actualizados tus datos de pago y contacto.",
          "Para disputas, envía detalles de referencia y pedido para verificación.",
        ],
      },
    ],
    noticeTitle: "Aviso importante",
    noticeBody: "Esta página es la referencia vigente de políticas de afiliados. Continuar en el programa implica aceptar las últimas actualizaciones.",
    backToAffiliate: "Volver a Afiliados",
  },
  pt: {
    pageTitle: "Documentação do Programa de Afiliados",
    pageDesc: "Consulte termos, estrutura de comissão, regras de liquidação e atualizações antes de promover.",
    updatedAt: "Última atualização: 2026-03-10",
    sections: [
      {
        title: "Termos do programa",
        points: [
          "Candidatos devem enviar informações completas e verdadeiras.",
          "Tráfego fraudulento ou abuso de política pode resultar em suspensão.",
          "A TinyTale pode atualizar termos por requisitos operacionais e legais.",
        ],
      },
      {
        title: "Estrutura de comissão",
        points: [
          "A comissão é calculada com base em pedidos elegíveis e concluídos dos indicados.",
          "As taxas podem variar por configuração administrativa e nível do promotor.",
          "Pedidos cancelados, reembolsados ou inválidos não geram comissão.",
        ],
      },
      {
        title: "Regras de liquidação",
        points: [
          "Solicitações de saque seguem valor mínimo e taxa da plataforma.",
          "Comissões podem permanecer pendentes durante validação e período de retenção.",
          "Após aprovação, o pagamento é enviado ao método cadastrado.",
        ],
      },
      {
        title: "Atualizações de informação",
        points: [
          "Atualizações são publicadas nesta página e, quando necessário, na comunidade.",
          "Mantenha dados de pagamento e contato sempre atualizados.",
          "Em disputas, envie dados de referência e pedido para análise.",
        ],
      },
    ],
    noticeTitle: "Aviso importante",
    noticeBody: "Esta página é a referência oficial das políticas de afiliados. A continuidade no programa implica aceitação das atualizações mais recentes.",
    backToAffiliate: "Voltar para Afiliados",
  },
  hi: {
    pageTitle: "अफिलिएट प्रोग्राम दस्तावेज़",
    pageDesc: "प्रमोशन शुरू करने से पहले नवीनतम शर्तें, कमीशन संरचना, सेटलमेंट नियम और अपडेट प्रक्रिया पढ़ें।",
    updatedAt: "अंतिम अपडेट: 2026-03-10",
    sections: [
      {
        title: "प्रोग्राम शर्तें",
        points: [
          "आवेदक को सही और पूर्ण जानकारी देनी होगी।",
          "फर्जी ट्रैफिक, धोखाधड़ी या नीति उल्लंघन पर खाता निलंबित किया जा सकता है।",
          "कानूनी/ऑपरेशनल आवश्यकता के अनुसार नीतियां अपडेट की जा सकती हैं।",
        ],
      },
      {
        title: "कमीशन संरचना",
        points: [
          "कमीशन रेफर किए गए उपयोगकर्ताओं के वैध पूर्ण ऑर्डर पर आधारित है।",
          "दरें एडमिन सेटिंग्स और प्रमोटर स्तर के अनुसार बदल सकती हैं।",
          "रद्द, रिफंड या अमान्य ऑर्डर कमीशन में शामिल नहीं होंगे।",
        ],
      },
      {
        title: "सेटलमेंट नियम",
        points: [
          "निकासी अनुरोध न्यूनतम सीमा और प्लेटफ़ॉर्म शुल्क नियमों के अधीन हैं।",
          "वैलिडेशन/फ्रीज़ अवधि में कमीशन लंबित रह सकता है।",
          "अनुमोदन के बाद भुगतान चुने गए माध्यम में जारी किया जाएगा।",
        ],
      },
      {
        title: "सूचना अपडेट",
        points: [
          "नीति अपडेट पहले इस पेज पर प्रकाशित होंगे और समुदाय चैनल में भी साझा हो सकते हैं।",
          "अपनी भुगतान और संपर्क जानकारी हमेशा अद्यतित रखें।",
          "विवाद की स्थिति में रेफरल और ऑर्डर विवरण देकर सत्यापन कराएं।",
        ],
      },
    ],
    noticeTitle: "महत्वपूर्ण सूचना",
    noticeBody: "यह पेज अफिलिएट नीति का वर्तमान संदर्भ है। कार्यक्रम जारी रखना नवीनतम अपडेट की स्वीकृति माना जाएगा।",
    backToAffiliate: "अफिलिएट पर वापस जाएं",
  },
  id: {
    pageTitle: "Dokumentasi Program Afiliasi",
    pageDesc: "Baca syarat terbaru, struktur komisi, aturan settlement, dan pembaruan informasi sebelum promosi.",
    updatedAt: "Terakhir diperbarui: 2026-03-10",
    sections: [
      {
        title: "Ketentuan program",
        points: [
          "Pendaftar wajib memberikan informasi yang lengkap dan akurat.",
          "Traffic palsu, penipuan, atau pelanggaran kebijakan dapat menyebabkan suspend akun.",
          "TinyTale dapat memperbarui ketentuan untuk kepatuhan dan kebutuhan operasional.",
        ],
      },
      {
        title: "Struktur komisi",
        points: [
          "Komisi dihitung dari pesanan referral yang valid dan selesai.",
          "Tingkat komisi dapat berubah sesuai pengaturan admin dan level promotor.",
          "Pesanan batal, refund, atau tidak valid tidak dihitung sebagai komisi.",
        ],
      },
      {
        title: "Aturan settlement",
        points: [
          "Penarikan mengikuti minimum payout dan biaya platform.",
          "Komisi bisa berstatus pending selama masa validasi dan freeze period.",
          "Setelah disetujui, payout diproses ke metode pembayaran yang dipilih.",
        ],
      },
      {
        title: "Pembaruan informasi",
        points: [
          "Pembaruan kebijakan dipublikasikan di halaman ini dan dapat diumumkan di komunitas.",
          "Pastikan data pembayaran dan kontak selalu terbaru.",
          "Jika ada sengketa, kirim detail referral/pesanan untuk verifikasi.",
        ],
      },
    ],
    noticeTitle: "Pemberitahuan penting",
    noticeBody: "Halaman ini adalah referensi kebijakan afiliasi terbaru. Tetap berpartisipasi berarti menyetujui pembaruan terbaru.",
    backToAffiliate: "Kembali ke Afiliasi",
  },
};

export default function AffiliateDocsPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);

  return (
    <div className="min-h-screen bg-[#0a0a12] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href={localizePath("/affiliate", locale)}
            className="inline-flex items-center gap-2 text-sm text-purple-400 transition hover:text-purple-300"
          >
            <span aria-hidden="true">&larr;</span>
            {t.backToAffiliate}
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-800/60 bg-[#13131d] p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{t.pageTitle}</h1>
          <p className="mt-3 text-gray-300">{t.pageDesc}</p>
          <p className="mt-2 text-xs text-gray-500">{t.updatedAt}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {t.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-xl border border-gray-800/70 bg-[#10101a] p-5"
              >
                <h2 className="text-base font-semibold text-white">{section.title}</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-300">
                  {section.points.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
            <h3 className="text-sm font-semibold text-purple-300">{t.noticeTitle}</h3>
            <p className="mt-2 text-sm text-gray-300">{t.noticeBody}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
