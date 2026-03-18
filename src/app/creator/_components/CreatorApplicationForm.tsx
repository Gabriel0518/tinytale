"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ExternalLink,
  FileText,
  Globe2,
  Link as LinkIcon,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  CREATOR_APPLICATION_STEP_TITLES,
  CREATOR_APPLICATION_STORAGE_KEY,
  CREATOR_GENRE_OPTIONS,
  CREATOR_LANGUAGE_OPTIONS,
  createEmptyCreatorApplicationDraft,
  deserializeCreatorApplicationDraft,
} from "@/lib/creator";
import { useCountryCatalog } from "@/hooks/useCountryCatalog";
import { localizePath } from "@/lib/i18n";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { useLocale } from "@/hooks/useLocale";
import type { CountryOption } from "@/lib/countries";
import type { CreatorApplicationDraft, CreatorProfileType, CreatorVerificationType } from "@/types/creator";
import { useCreatorI18n } from "../_lib/creator-i18n";

const STEP_CONFIG = [
  { step: 1, title: "Basic Info", route: "/creator/apply" },
  { step: 2, title: "Creative Profile", route: "/creator/apply/creative" },
  { step: 3, title: "Identity", route: "/creator/apply/identity" },
  { step: 4, title: "Agreement", route: "/creator/apply/agreement" },
  { step: 5, title: "Review", route: "/creator/apply/review" },
] as const;

const VERIFICATION_OPTIONS: Array<{
  value: CreatorVerificationType;
  title: string;
  description: string;
}> = [
  { value: "government_id", title: "Government ID", description: "National ID card or state-issued ID." },
  { value: "passport", title: "Passport", description: "International passport for identity verification." },
  { value: "business_license", title: "Business License", description: "Required for company-based applications." },
];

type AgreementBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] };

type AgreementSectionCopy = {
  title: string;
  blocks: AgreementBlock[];
};

type AgreementCopy = {
  intro: string;
  sections: AgreementSectionCopy[];
};

const CREATOR_AGREEMENT_COPY: Record<string, AgreementCopy> = {
  en: {
    intro:
      'Welcome to TinyTale! Please read this agreement carefully before completing your registration. By finishing the registration process, checking "I have read and agree to this agreement," or uploading any content to TinyTale, you acknowledge that you fully understand and agree to all terms herein. This agreement is legally binding between you and TinyTale. If you do not agree with any provision, please stop registration immediately.',
    sections: [
      {
        title: "1. Definitions",
        blocks: [
          {
            type: "paragraph",
            text:
              '"TinyTale" or "Platform" refers to the short drama video streaming platform operated by Coinrizon Limited, including the website, mobile applications, and related services. "Creator" or "You" refers to the individual or entity that registers and uploads short drama content on TinyTale. "Content" refers to short drama videos, scripts, audio, images, text descriptions, and other related materials uploaded by the Creator. "Viewer" refers to users who watch or pay to unlock short drama content on TinyTale.',
          },
        ],
      },
      {
        title: "2. Content rights and licensing",
        blocks: [
          {
            type: "paragraph",
            text:
              "You warrant that you hold complete and lawful intellectual property rights to all uploaded content, or have obtained proper authorization. Copyright ownership of the content remains with you.",
          },
          {
            type: "paragraph",
            text:
              "Upon uploading, you grant TinyTale a worldwide, royalty-free, non-exclusive, sublicensable, irrevocable license to:",
          },
          {
            type: "bullets",
            items: [
              "Store, display, stream, and distribute your content on the platform and partner channels;",
              "Translate, dub, edit, add subtitles, or create promotional materials from your content for marketing and commercial purposes;",
              "Allow viewers to watch and share your content through paid (coin unlock, VIP subscription) or free access;",
              "Use your creator name, avatar, and content clips for platform marketing and promotion.",
            ],
          },
          {
            type: "paragraph",
            text:
              "If a third party infringes upon your content rights on the platform, you authorize TinyTale to take legal action on the platform's behalf (but without obligation). Any proceeds from such actions, after deducting reasonable costs, will be distributed according to the revenue-sharing rules in this agreement.",
          },
        ],
      },
      {
        title: "3. Revenue sharing and settlement",
        blocks: [
          {
            type: "paragraph",
            text:
              "Revenue sources: You are entitled to a share of revenue generated when viewers pay to unlock episodes with coins, subscribe to VIP memberships, or tip your content, in accordance with this agreement.",
          },
          {
            type: "paragraph",
            text:
              "Revenue calculation: The specific revenue formula, split ratio, and deductions (including but not limited to app store fees, Stripe payment processing fees, and operational costs) are subject to the latest settlement rules published in the TinyTale Creator Center. All creator-facing revenue is displayed in USD. TinyTale reserves the right to adjust the revenue-sharing rules based on business development, with updated rules posted in the Creator Center.",
          },
          {
            type: "paragraph",
            text:
              "Settlement cycle: Revenue is settled on a calendar-month basis. TinyTale will calculate the previous month's distributable revenue and settle it to your linked payout account within 15 business days of the following month.",
          },
          {
            type: "paragraph",
            text:
              "Withdrawal and taxes: You must meet the platform's minimum withdrawal threshold to request a payout. You are solely responsible for any personal income tax and other taxes arising from your earnings. Where required by law, TinyTale may withhold taxes before disbursing revenue.",
          },
        ],
      },
      {
        title: "4. Creator obligations",
        blocks: [
          {
            type: "paragraph",
            text:
              "Content legality: You warrant that your uploaded content does not infringe any third party's intellectual property, likeness, reputation, or privacy rights; does not contain obscene, violent, extremist, discriminatory, hateful, or misleading material or content that violates applicable laws; and does not include unauthorized music, film clips, trademarks, or other protected materials.",
          },
          {
            type: "paragraph",
            text:
              "Accurate information: You must provide truthful, accurate, and complete registration and payout information and update it promptly. You bear all consequences arising from inaccurate information.",
          },
          {
            type: "paragraph",
            text:
              "No fraud: You must not artificially inflate view counts, revenue, or rankings through view botting, fake transactions, bot accounts, or other illegitimate means.",
          },
        ],
      },
      {
        title: "5. Content review and moderation",
        blocks: [
          {
            type: "paragraph",
            text:
              "TinyTale reserves the right to review all uploaded content. The platform may refuse to publish, take down, or delete content that violates this agreement or platform rules. Every drama submission is reviewed for compliance, rights ownership, metadata quality, and age-rating accuracy.",
          },
        ],
      },
      {
        title: "6. DMCA and copyright enforcement",
        blocks: [
          {
            type: "paragraph",
            text:
              "You agree to cooperate with copyright reviews, DMCA notices, and counter-notice procedures. Confirmed repeat infringement may trigger suspension or permanent termination of your creator account in accordance with platform policy.",
          },
          {
            type: "paragraph",
            text:
              "If you discover that another party has infringed upon your rights on the platform, you may submit an infringement notice through the platform's designated complaint channel, and TinyTale will process it in accordance with applicable law.",
          },
        ],
      },
      {
        title: "7. Account management and enforcement",
        blocks: [
          {
            type: "paragraph",
            text:
              "If you violate this agreement, TinyTale may, depending on severity, take the following actions:",
          },
          {
            type: "bullets",
            items: [
              "Issue a warning or restrict account features;",
              "Remove or take down infringing content;",
              "Freeze or deduct unsettled revenue;",
              "Suspend or permanently ban your account.",
            ],
          },
        ],
      },
      {
        title: "8. Liability and indemnification",
        blocks: [
          {
            type: "paragraph",
            text:
              "If your uploaded content causes TinyTale or its affiliates to face third-party claims, lawsuits, regulatory penalties, app store removal, or termination of partnerships, you shall indemnify TinyTale for all direct and indirect losses, including damages, fines, settlement costs, legal fees, and losses from business interruption or reputational harm.",
          },
          {
            type: "paragraph",
            text:
              "TinyTale may deduct such amounts directly from your unsettled revenue. Any shortfall must be paid within 15 days of notice.",
          },
        ],
      },
      {
        title: "9. Banking, payouts, and tax responsibilities",
        blocks: [
          {
            type: "paragraph",
            text:
              "Bank account or payment method verification is required before payout processing. You are responsible for local tax reporting and must ensure your payout information remains accurate and current. TinyTale is not liable for payment delays caused by incorrect payout information.",
          },
        ],
      },
      {
        title: "10. Agreement changes and termination",
        blocks: [
          {
            type: "paragraph",
            text:
              "Changes: TinyTale reserves the right to modify this agreement at any time. Changes will be communicated through prominent platform announcements, email to your registered address, or in-app notifications. Continued use of the platform after such notice constitutes acceptance of the updated terms.",
          },
          {
            type: "paragraph",
            text:
              "Your termination right: You may stop using the platform and deactivate your account at any time; however, previously uploaded content and the licenses granted to TinyTale remain in effect after account closure.",
          },
          {
            type: "paragraph",
            text:
              "Platform termination right: TinyTale may unilaterally terminate this agreement and ban your account for serious violations. After termination, unsettled revenue will be handled per platform rules; already-settled revenue is unaffected.",
          },
        ],
      },
      {
        title: "11. Privacy and data protection",
        blocks: [
          {
            type: "paragraph",
            text:
              "TinyTale collects, uses, and protects your personal information and content data in accordance with the TinyTale Privacy Policy. The platform may use your content data (such as view counts, audience demographics, and revenue data) for operational analysis, algorithm optimization, and business decisions, but will not disclose your personal identity to third parties except as required by law.",
          },
        ],
      },
      {
        title: "12. Governing law and dispute resolution",
        blocks: [
          {
            type: "paragraph",
            text:
              "This agreement is governed by the laws of the Hong Kong Special Administrative Region. Any dispute arising from or in connection with this agreement shall first be resolved through amicable negotiation. If negotiation fails, either party may submit the dispute to the Singapore International Arbitration Centre (SIAC) for resolution.",
          },
        ],
      },
      {
        title: "13. Miscellaneous",
        blocks: [
          {
            type: "paragraph",
            text:
              "This agreement constitutes the entire agreement between you and TinyTale regarding creator services and supersedes any prior oral or written agreements on the same subject matter. If any provision is held invalid or unenforceable by a court or arbitral tribunal of competent jurisdiction, the invalidity of that provision shall not affect the validity of the remaining provisions.",
          },
          {
            type: "paragraph",
            text: "For questions about this agreement, please contact us at: support@tinytale.top",
          },
        ],
      },
    ],
  },
  zh: {
    intro:
      "欢迎使用 TinyTale。请你在完成注册前认真阅读本协议。只要你完成注册流程、勾选“我已阅读并同意本协议”，或向 TinyTale 上传任何内容，即表示你已充分理解并接受本协议全部条款。本协议对你与 TinyTale 均具有法律约束力。如你不同意其中任何内容，请立即停止注册或使用。",
    sections: [
      {
        title: "1. 定义",
        blocks: [
          {
            type: "paragraph",
            text:
              "“TinyTale”或“平台”是指由 Coinrizon Limited 运营的短剧视频流媒体平台，包括网站、移动应用及相关服务。“创作者”或“你”是指在 TinyTale 注册并上传短剧内容的个人或机构。“内容”是指创作者上传的短剧视频、剧本、音频、图片、文字说明及其他相关材料。“观众”是指在 TinyTale 浏览、观看或付费解锁短剧内容的用户。",
          },
        ],
      },
      {
        title: "2. 内容权利与授权",
        blocks: [
          {
            type: "paragraph",
            text:
              "你声明并保证，你对所上传的全部内容拥有完整、合法且可处分的知识产权，或已取得充分、有效的授权。内容的著作权及其他原始权利仍归你所有。",
          },
          {
            type: "paragraph",
            text:
              "自内容上传之日起，你授予 TinyTale 一项全球范围内、免版税、非独占、可转授权且不可撤销的使用许可，以便平台可以：",
          },
          {
            type: "bullets",
            items: [
              "在平台及合作渠道存储、展示、播放、分发你的内容；",
              "基于运营、推广和商业化目的，对内容进行翻译、配音、剪辑、字幕制作或生成宣传素材；",
              "允许观众以付费方式（如金币解锁、VIP 订阅）或免费方式观看、分享你的内容；",
              "在平台宣传、市场推广及品牌传播中使用你的创作者名称、头像和内容片段。",
            ],
          },
          {
            type: "paragraph",
            text:
              "如第三方在平台内侵犯你的内容权利，你授权 TinyTale 以平台名义视情况采取维权措施，但 TinyTale 不因此承担必须维权的义务。相关维权所得在扣除合理成本后，按本协议约定的分成规则处理。",
          },
        ],
      },
      {
        title: "3. 收入分成与结算",
        blocks: [
          {
            type: "paragraph",
            text:
              "收入来源：观众通过金币解锁剧集、开通 VIP 会员、对内容进行打赏等方式形成的可分配收入，你有权依本协议获得相应分成。",
          },
          {
            type: "paragraph",
            text:
              "收入计算：具体分成公式、比例及扣减项（包括但不限于应用商店费用、Stripe 支付通道手续费及平台运营成本），以 TinyTale 创作者中心最新公布的结算规则为准。所有面向创作者展示的收入统一以美元计价。TinyTale 可根据业务发展调整分成规则，并在创作者中心发布更新版本。",
          },
          {
            type: "paragraph",
            text:
              "结算周期：平台按自然月进行结算，并将在次月完成上月可结算收入核算后，于 15 个工作日内结算至你绑定的收款账户。",
          },
          {
            type: "paragraph",
            text:
              "提现与税务：你需达到平台规定的最低提现门槛后方可申请打款。因创作收入产生的个人所得税或其他税费，由你自行依法申报并承担；如法律要求，TinyTale 有权在打款前依法代扣代缴。",
          },
        ],
      },
      {
        title: "4. 创作者义务",
        blocks: [
          {
            type: "paragraph",
            text:
              "内容合法合规：你保证上传内容不侵犯任何第三方的知识产权、肖像权、名誉权、隐私权等合法权益；不包含淫秽、暴力、极端、歧视、仇恨、误导性内容或任何违反适用法律法规的内容；也不得包含未经授权的音乐、影视片段、商标或其他受保护素材。",
          },
          {
            type: "paragraph",
            text:
              "信息真实准确：你应提供真实、准确、完整的注册信息、身份信息及收款信息，并在信息发生变化时及时更新。因信息不实、不完整或未及时更新导致的一切后果，由你自行承担。",
          },
          {
            type: "paragraph",
            text:
              "禁止作弊与刷量：你不得通过刷量、虚假交易、机器人账号、异常流量或其他不正当方式人为提升播放量、收入、排名或平台数据表现。",
          },
        ],
      },
      {
        title: "5. 内容审核与平台管理",
        blocks: [
          {
            type: "paragraph",
            text:
              "TinyTale 有权对全部上传内容进行审核。对于违反本协议或平台规则的内容，平台可拒绝发布、下架、删除或采取其他必要措施。每一部短剧提交后，平台都会对其合规性、权利归属、元数据质量以及年龄分级准确性进行审核。",
          },
        ],
      },
      {
        title: "6. DMCA 与版权维权",
        blocks: [
          {
            type: "paragraph",
            text:
              "你同意配合平台处理版权审核、DMCA 通知及反通知流程。若平台确认存在重复侵权情形，可依据平台政策暂停或永久终止你的创作者账号。",
          },
          {
            type: "paragraph",
            text:
              "如你发现平台内其他主体侵犯了你的合法权益，可通过平台指定的投诉渠道提交侵权通知，TinyTale 将依据适用法律及平台规则进行处理。",
          },
        ],
      },
      {
        title: "7. 账号管理与违规处理",
        blocks: [
          {
            type: "paragraph",
            text:
              "如你违反本协议，TinyTale 有权根据违规程度采取以下一项或多项措施：",
          },
          {
            type: "bullets",
            items: [
              "发出警告或限制账号部分功能；",
              "移除、下架相关违规内容；",
              "冻结或扣减未结算收入；",
              "暂停或永久封禁你的创作者账号。",
            ],
          },
        ],
      },
      {
        title: "8. 责任承担与赔偿",
        blocks: [
          {
            type: "paragraph",
            text:
              "如因你上传的内容导致 TinyTale 或其关联方遭受第三方索赔、诉讼、监管处罚、应用商店下架、合作终止或其他损失，你应就由此产生的全部直接及间接损失向 TinyTale 进行赔偿，包括但不限于赔偿金、罚款、和解费用、律师费、商誉损失及业务中断损失。",
          },
          {
            type: "paragraph",
            text:
              "TinyTale 有权直接从你尚未结算的收入中抵扣相关金额；若不足抵扣，你应在收到通知后 15 日内补足。",
          },
        ],
      },
      {
        title: "9. 收款账户、打款与税务责任",
        blocks: [
          {
            type: "paragraph",
            text:
              "在平台处理打款前，你必须完成收款账户或支付方式验证。你需自行履行所在地税务申报义务，并保证收款信息始终准确、有效。因收款信息错误导致的打款延误、失败或损失，TinyTale 不承担责任。",
          },
        ],
      },
      {
        title: "10. 协议变更与终止",
        blocks: [
          {
            type: "paragraph",
            text:
              "协议变更：TinyTale 有权根据业务、合规或运营需要随时修改本协议，并通过平台公告、注册邮箱通知或站内消息等方式向你提示。你在收到通知后继续使用平台，即视为接受修订后的协议。",
          },
          {
            type: "paragraph",
            text:
              "你主动终止：你可随时停止使用平台并申请停用账号，但你此前已上传内容所授予 TinyTale 的相关使用许可，在账号关闭后仍继续有效。",
          },
          {
            type: "paragraph",
            text:
              "平台终止权：若你存在严重违规行为，TinyTale 有权单方终止本协议并封禁账号。终止后，未结算收入将按平台规则处理，已结算收入不受影响。",
          },
        ],
      },
      {
        title: "11. 隐私与数据保护",
        blocks: [
          {
            type: "paragraph",
            text:
              "TinyTale 将依照《TinyTale 隐私政策》收集、使用并保护你的个人信息及内容数据。平台可基于运营分析、算法优化和业务决策需要，使用与你内容表现相关的数据（如播放量、受众画像、收入数据等），但除法律法规另有要求外，不会向第三方披露可直接识别你个人身份的信息。",
          },
        ],
      },
      {
        title: "12. 适用法律与争议解决",
        blocks: [
          {
            type: "paragraph",
            text:
              "本协议受香港特别行政区法律管辖。因本协议引起或与本协议有关的任何争议，双方应先友好协商解决；协商不成的，任一方均可将争议提交至新加坡国际仲裁中心（SIAC）依其届时有效的仲裁规则处理。",
          },
        ],
      },
      {
        title: "13. 其他条款",
        blocks: [
          {
            type: "paragraph",
            text:
              "本协议构成你与 TinyTale 就创作者服务事项达成的完整约定，并取代此前双方就同类事项形成的所有口头或书面约定。如本协议任一条款被有管辖权的法院或仲裁机构认定为无效或不可执行，不影响其余条款的效力。",
          },
          {
            type: "paragraph",
            text: "如你对本协议有任何疑问，请联系：support@tinytale.top",
          },
        ],
      },
    ],
  },
};

function createDefaultDraft() {
  return createEmptyCreatorApplicationDraft();
}

function formatRelativeUpdate(value: string, t: ReturnType<typeof useCreatorI18n>["t"]): string {
  if (!value) return t("Not saved yet");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("Not saved yet");
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("Saved just now");
  if (minutes < 60) return t("Saved __ARG_0__m ago", minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("Saved __ARG_0__h ago", hours);
  const days = Math.floor(hours / 24);
  return t("Saved __ARG_0__d ago", days);
}

function compactLinks(values: string[]): string[] {
  const next = values.map((value) => value.trim());
  while (next.length > 1 && !next[next.length - 1]) {
    next.pop();
  }
  return next;
}

function isPositiveInteger(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

function getIdentityPrimaryUploadLabel(
  draft: CreatorApplicationDraft,
  t: ReturnType<typeof useCreatorI18n>["t"]
): string {
  if (draft.basicInformation.creatorType === "company") return t("Registration Document");
  return draft.identityVerification.verificationType === "passport" ? t("Passport Copy") : t("ID Card Front");
}

function getIdentitySecondaryUploadLabel(
  _draft: CreatorApplicationDraft,
  t: ReturnType<typeof useCreatorI18n>["t"]
): string {
  return t("ID Card Back");
}

function getIdentityVerificationTitle(
  draft: CreatorApplicationDraft,
  t: ReturnType<typeof useCreatorI18n>["t"]
): string {
  if (draft.basicInformation.creatorType === "company") return t("Business Registration");
  return draft.identityVerification.verificationType === "passport" ? t("Passport") : t("Government ID");
}

function isImageDocument(fileName: string, fileUrl?: string): boolean {
  const source = `${fileName} ${fileUrl || ""}`.toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(source);
}

function isPdfDocument(fileName: string, fileUrl?: string): boolean {
  const source = `${fileName} ${fileUrl || ""}`.toLowerCase();
  return /\.pdf(\?|$)/i.test(source);
}

function validateStep(step: number, draft: CreatorApplicationDraft, t: ReturnType<typeof useCreatorI18n>["t"]): string[] {
  const errors: string[] = [];

  if (step === 1) {
    if (draft.basicInformation.creatorType === "company") {
      if (!draft.basicInformation.companyName.trim()) errors.push(t("Company name is required."));
      if (!draft.basicInformation.businessType.trim()) errors.push(t("Business type is required."));
      if (!draft.basicInformation.registrationId.trim()) errors.push(t("Registration ID is required."));
      if (!draft.basicInformation.companyAddress.trim()) errors.push(t("Company address is required."));
      if (!draft.basicInformation.region.trim()) errors.push(t("Region is required."));
    } else {
      if (!draft.basicInformation.legalName.trim()) errors.push(t("Full name is required."));
      if (!draft.basicInformation.age.trim()) {
        errors.push(t("Age is required."));
      } else if (!isPositiveInteger(draft.basicInformation.age)) {
        errors.push(t("Age must be a valid whole number."));
      }
      if (!draft.basicInformation.idNumber.trim()) errors.push(t("ID number is required."));
    }

    if (!draft.basicInformation.email.trim()) errors.push(t("Email is required."));
    if (!draft.basicInformation.phone.trim()) errors.push(t("Phone number is required."));
    if (!draft.basicInformation.country.trim()) errors.push(t("Country or region is required."));
  }

  if (step === 2) {
    if (draft.creativeInformation.genres.length === 0) errors.push(t("Select at least one creative genre."));
    if (!draft.creativeInformation.primaryLanguage.trim()) errors.push(t("Primary language is required."));
    if (!draft.creativeInformation.portfolioLinks.some((value) => value.trim())) {
      errors.push(t("Add at least one portfolio or social link."));
    }
    if (!draft.creativeInformation.bio.trim()) errors.push(t("Creator bio or studio introduction is required."));
  }

  if (step === 3) {
    if (!draft.identityVerification.frontDocumentFileName.trim()) {
      errors.push(
        draft.basicInformation.creatorType === "company"
          ? t("Upload the registration document.")
          : draft.identityVerification.verificationType === "passport"
            ? t("Upload the passport copy.")
            : t("Upload the ID card front.")
      );
    }
    if (draft.basicInformation.creatorType === "individual" && draft.identityVerification.verificationType === "government_id" && !draft.identityVerification.backDocumentFileName.trim()) {
      errors.push(t("Upload the ID card back."));
    }
  }

  if (step === 4) {
    if (!draft.agreement.hasReviewedFullAgreement) {
      errors.push(t("Please review the creator agreement through the end before continuing."));
    }
    if (!draft.agreement.acceptedTerms) {
      errors.push(t("You must accept the TinyTale Creator Agreement."));
    }
    if (!draft.agreement.acceptedAuthenticity) {
      errors.push(t("You must confirm content authenticity and rights ownership."));
    }
    if (!draft.agreement.signatureName.trim()) {
      errors.push(t("Signature name is required."));
    }
  }

  return errors;
}

interface CreatorApplicationFormProps {
  step: 1 | 2 | 3 | 4 | 5;
}

export default function CreatorApplicationForm({ step }: CreatorApplicationFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { options: countryOptions } = useCountryCatalog(locale);
  const { token, user } = useAuth();
  const { t } = useCreatorI18n();
  const { toast } = useToast();
  const [draft, setDraft] = useState<CreatorApplicationDraft>(createDefaultDraft());
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const progressPercent = Math.round((step / STEP_CONFIG.length) * 100);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      let next = createDefaultDraft();
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(CREATOR_APPLICATION_STORAGE_KEY);
        if (raw) {
          try {
            next = deserializeCreatorApplicationDraft(JSON.parse(raw));
          } catch {
            next = createDefaultDraft();
          }
        }
      }

      if (token) {
        try {
          const response = await creatorApi.getApplicationDraft(token);
          next = deserializeCreatorApplicationDraft(response, next);
        } catch {
          // Fall back to local draft.
        }
      }

      if (!cancelled) {
        setDraft(next);
        setReady(true);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!ready || !user?.email) return;
    setDraft((current) => {
      if (current.basicInformation.email.trim()) return current;
      const next = {
        ...current,
        basicInformation: { ...current.basicInformation, email: user.email || "" },
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CREATOR_APPLICATION_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, [ready, user?.email]);

  const maxAccessibleStep = useMemo(() => Math.max(1, draft.lastCompletedStep + 1), [draft.lastCompletedStep]);
  const currentTitle = CREATOR_APPLICATION_STEP_TITLES[step - 1];

  function pushStep(targetStep: number) {
    const target = STEP_CONFIG[targetStep - 1];
    if (!target) return;
    router.push(localizePath(target.route, locale));
  }

  function persistLocal(next: CreatorApplicationDraft) {
    setDraft(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CREATOR_APPLICATION_STORAGE_KEY, JSON.stringify(next));
    }
  }

  async function persistRemote(next: CreatorApplicationDraft) {
    if (!token) return;
    await creatorApi.saveApplicationDraft(token, next);
  }

  function updateDraft(updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) {
    setSubmitError("");
    setErrors([]);
    const next = updater(draft);
    persistLocal({ ...next, updatedAt: new Date().toISOString() });
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    setSubmitError("");
    try {
      const next = { ...draft, updatedAt: new Date().toISOString() };
      persistLocal(next);
      await persistRemote(next);
      toast(t("Draft Saved"), "success");
      router.push(localizePath("/creator", locale));
    } catch (error: any) {
      const message = error?.message || t("Failed to save draft.");
      setSubmitError(message);
      toast(message, "error");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleNext() {
    const stepErrors = validateStep(step, draft, t);
    setErrors(stepErrors);
    if (stepErrors.length > 0) return;

    const next = {
      ...draft,
      lastCompletedStep: Math.max(draft.lastCompletedStep, step),
      updatedAt: new Date().toISOString(),
    };

    persistLocal(next);
    try {
      await persistRemote(next);
    } catch (error: any) {
      setSubmitError(error?.message || t("Failed to save progress."));
      return;
    }

    if (step < 5) pushStep(step + 1);
  }

  async function handleSubmit() {
    const finalErrors = [1, 2, 3, 4].flatMap((index) => validateStep(index, draft, t));
    setErrors(finalErrors);
    if (finalErrors.length > 0) return;
    if (!token) {
      router.push(localizePath("/auth/login", locale));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const next = {
        ...draft,
        lastCompletedStep: 5,
        updatedAt: new Date().toISOString(),
      };
      persistLocal(next);
      await creatorApi.submitApplication(token, next);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CREATOR_APPLICATION_STORAGE_KEY);
      }
      router.push(localizePath("/creator/pending", locale));
    } catch (error: any) {
      setSubmitError(error?.message || t("Failed to submit your application."));
      router.push(`${localizePath("/creator/apply/status", locale)}?result=failed`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#f8fafc]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1876f2] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#f8fafc] px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto w-full max-w-[860px]">
        <div className="mb-5 rounded-[24px] border border-[#e2e8f0] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">{t("Creator Onboarding")}</p>
              <h1 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[30px]">
                {t("Step __ARG_0__ of __ARG_1__: __ARG_2__", step, STEP_CONFIG.length, t(currentTitle))}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                {t("Complete your TinyTale creator application. We will review profile quality, identity documents, and rights confirmation before creator access is granted.")}
              </p>
            </div>
            <div className="rounded-full bg-[#eff6ff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              {t("__ARG_0__% complete", progressPercent)}
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#e2e8f0]">
            <div className="h-full rounded-full bg-[#1876f2] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-1">
            {STEP_CONFIG.map((item) => {
              const active = item.step === step;
              const canJump = item.step <= maxAccessibleStep;
              return (
                <button
                  key={item.step}
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && pushStep(item.step)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[#eff6ff] text-[#1d4ed8]"
                      : canJump
                        ? "text-[#475569] hover:bg-[#f8fafc]"
                        : "cursor-not-allowed text-[#cbd5e1]"
                  }`}
                >
                  {t(item.title)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#94a3b8]">
            <p>{formatRelativeUpdate(draft.updatedAt, t)}</p>
            <p>{t("All creator agreements are displayed in-page and require explicit acceptance before submission.")}</p>
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="mb-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-5 py-4 text-sm text-[#b91c1c]">
            <p className="mb-2 font-semibold">{t("Please resolve the following before continuing:")}</p>
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 1 ? <StepBasic draft={draft} onChange={updateDraft} countryOptions={countryOptions} /> : null}
        {step === 2 ? <StepCreative draft={draft} onChange={updateDraft} /> : null}
        {step === 3 ? <StepIdentity draft={draft} onChange={updateDraft} token={token} /> : null}
        {step === 4 ? <StepAgreement draft={draft} onChange={updateDraft} /> : null}
        {step === 5 ? (
          <StepReview
            draft={draft}
            onEdit={pushStep}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            submitting={submitting}
            savingDraft={savingDraft}
          />
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-5">
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => pushStep(step - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("Previous Step")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="inline-flex items-center gap-2 rounded-xl border border-[#dbe2ea] bg-white px-4 py-2 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {savingDraft ? t("Saving Draft...") : t("Save Draft")}
            </button>
          </div>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-[#1876f2] px-6 py-2 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(24,118,242,0.22)] hover:bg-[#1669da]"
            >
              {t("Continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {submitError ? (
          <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {submitError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  const { t } = useCreatorI18n();
  return (
    <label className="mb-2 block text-sm font-semibold text-[#334155]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[#94a3b8]">{t("(optional)")}</span> : null}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <div className="relative">
        {icon ? <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">{icon}</span> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:bg-white ${icon ? "pl-11" : ""}`}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: readonly string[] | CountryOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useCreatorI18n();
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: t(option) } : option
  );

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2] focus:bg-white"
      >
        <option value="">{t(placeholder)}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:p-6">
      <h2 className="text-lg font-bold text-[#0f172a] md:text-[22px]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function StepBasic({
  draft,
  onChange,
  countryOptions,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
  countryOptions: CountryOption[];
}) {
  const { t } = useCreatorI18n();
  return (
    <SectionCard
      title={t("Basic creator information")}
      description={t("Collect the legal identity and contact information needed for application review and creator account setup.")}
    >
      <div>
        <FieldLabel>{t("Applicant Type")}</FieldLabel>
        <div className="inline-flex rounded-2xl bg-[#f1f5f9] p-1">
          {(["individual", "company"] as CreatorProfileType[]).map((option) => {
            const active = draft.basicInformation.creatorType === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    basicInformation: {
                      ...current.basicInformation,
                      creatorType: option,
                    },
                    identityVerification: {
                      ...current.identityVerification,
                      verificationType:
                        option === "company"
                          ? "business_license"
                          : current.identityVerification.verificationType === "business_license"
                            ? "government_id"
                            : current.identityVerification.verificationType,
                    },
                  }))
                }
                className={`rounded-2xl px-4 py-2 text-[13px] font-semibold transition ${
                  active ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                }`}
              >
                {option === "individual" ? t("Individual Creator") : t("Company / Studio")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label={draft.basicInformation.creatorType === "company" ? t("Company Name") : t("Full Name")}
          value={draft.basicInformation.creatorType === "company" ? draft.basicInformation.companyName : draft.basicInformation.legalName}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              basicInformation: {
                ...current.basicInformation,
                [current.basicInformation.creatorType === "company" ? "companyName" : "legalName"]: value,
              },
            }))
          }
          placeholder={draft.basicInformation.creatorType === "company" ? t("TinyTale Studio LLC") : "Alex Morgan"}
          icon={draft.basicInformation.creatorType === "company" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
        />

        {draft.basicInformation.creatorType === "company" ? (
          <InputField
            label={t("Business Type")}
            value={draft.basicInformation.businessType}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, businessType: value },
              }))
            }
            placeholder={t("Short drama studio / MCN / Talent agency")}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
          />
        ) : (
          <InputField
            label={t("Age")}
            type="number"
            value={draft.basicInformation.age}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, age: value },
              }))
            }
            placeholder="28"
            icon={<BadgeCheck className="h-4 w-4" />}
          />
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {draft.basicInformation.creatorType === "company" ? (
          <InputField
            label={t("Registration ID")}
            value={draft.basicInformation.registrationId}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, registrationId: value },
              }))
            }
            placeholder="US-12345678"
            icon={<FileText className="h-4 w-4" />}
          />
        ) : (
          <InputField
            label={t("ID Number")}
            value={draft.basicInformation.idNumber}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, idNumber: value },
              }))
            }
            placeholder="A123456789"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        )}
        <InputField
          label={draft.basicInformation.creatorType === "company" ? t("Company Address") : t("Email")}
          type={draft.basicInformation.creatorType === "company" ? "text" : "email"}
          value={draft.basicInformation.creatorType === "company" ? draft.basicInformation.companyAddress : draft.basicInformation.email}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              basicInformation: {
                ...current.basicInformation,
                [current.basicInformation.creatorType === "company" ? "companyAddress" : "email"]: value,
              },
            }))
          }
          placeholder={draft.basicInformation.creatorType === "company" ? "350 Fifth Avenue, New York, NY" : "creator@studio.com"}
          icon={draft.basicInformation.creatorType === "company" ? <Building2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
        />
      </div>

      {draft.basicInformation.creatorType === "company" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label={t("Email")}
            type="email"
            value={draft.basicInformation.email}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, email: value },
              }))
            }
            placeholder="creator@studio.com"
            icon={<Mail className="h-4 w-4" />}
          />
          <InputField
            label={t("Phone Number")}
            value={draft.basicInformation.phone}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, phone: value },
              }))
            }
            placeholder="+1 555 010 3000"
            icon={<Phone className="h-4 w-4" />}
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label={t("Phone Number")}
            value={draft.basicInformation.phone}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, phone: value },
              }))
            }
            placeholder="+1 555 010 3000"
            icon={<Phone className="h-4 w-4" />}
          />
          <div />
        </div>
      )}

      {draft.basicInformation.creatorType === "company" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label={t("Region")}
            value={draft.basicInformation.region}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, region: value },
              }))
            }
            placeholder="California"
            icon={<Globe2 className="h-4 w-4" />}
          />
          <div />
        </div>
      ) : null}

      <SelectField
        label={t("Country / Region")}
        value={draft.basicInformation.country}
        options={countryOptions}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            basicInformation: { ...current.basicInformation, country: value },
          }))
        }
        placeholder={t("Select country or region")}
      />

      <div className="rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
        {draft.basicInformation.creatorType === "company"
          ? t("Company applications require the legal entity record, business type, registration identifier, mailing address, and operating region.")
          : t("Individual applications require the creator's legal profile, age, ID number, and direct contact information.")}
      </div>
    </SectionCard>
  );
}

function StepCreative({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  const { t } = useCreatorI18n();
  return (
    <SectionCard
      title={t("Creative profile")}
      description={t("Describe your storytelling focus, language, and proof of prior work. These signals drive onboarding review and creator quality scoring.")}
    >
      <div>
        <FieldLabel>{t("Genres")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CREATOR_GENRE_OPTIONS.map((genre) => {
            const selected = draft.creativeInformation.genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() =>
                  onChange((current) => {
                    const genres = selected
                      ? current.creativeInformation.genres.filter((item) => item !== genre)
                      : [...current.creativeInformation.genres, genre];
                    return {
                      ...current,
                      creativeInformation: { ...current.creativeInformation, genres },
                    };
                  })
                }
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  selected ? "border-[#1876f2] bg-[#1876f2] text-white" : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#94a3b8]"
                }`}
              >
                {selected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}
                {t(genre)}
              </button>
            );
          })}
        </div>
      </div>

      <SelectField
        label={t("Primary Language")}
        value={draft.creativeInformation.primaryLanguage}
        options={CREATOR_LANGUAGE_OPTIONS}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            creativeInformation: { ...current.creativeInformation, primaryLanguage: value },
          }))
        }
      />

      <div>
        <FieldLabel>{t("Portfolio Links")}</FieldLabel>
        <div className="space-y-3">
          {draft.creativeInformation.portfolioLinks.map((link, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-1">
                <InputField
                  label={t("Portfolio Link __ARG_0__", index + 1)}
                  value={link}
                  onChange={(value) =>
                    onChange((current) => {
                      const portfolioLinks = [...current.creativeInformation.portfolioLinks];
                      portfolioLinks[index] = value;
                      return {
                        ...current,
                        creativeInformation: {
                          ...current.creativeInformation,
                          portfolioLinks: compactLinks(portfolioLinks),
                        },
                      };
                    })
                  }
                  placeholder={t("https://youtube.com/@creator or https://tiktok.com/@creator")}
                  icon={<LinkIcon className="h-4 w-4" />}
                  optional={index > 0}
                />
              </div>
              {draft.creativeInformation.portfolioLinks.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      creativeInformation: {
                        ...current.creativeInformation,
                        portfolioLinks: current.creativeInformation.portfolioLinks.filter((_, itemIndex) => itemIndex !== index),
                      },
                    }))
                  }
                  className="mt-7 rounded-xl border border-[#e2e8f0] px-3 py-2 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                >
                  {t("Remove")}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {draft.creativeInformation.portfolioLinks.length < 3 ? (
          <button
            type="button"
            onClick={() =>
              onChange((current) => ({
                ...current,
                creativeInformation: {
                  ...current.creativeInformation,
                  portfolioLinks: [...current.creativeInformation.portfolioLinks, ""],
                },
              }))
            }
            className="mt-3 text-sm font-semibold text-[#1876f2] hover:text-[#1669da]"
          >
            {t("+ Add another link")}
          </button>
        ) : null}
      </div>

      <div>
        <FieldLabel>{t("Creator Bio / Studio Introduction")}</FieldLabel>
        <textarea
          rows={6}
          maxLength={1000}
          value={draft.creativeInformation.bio}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              creativeInformation: { ...current.creativeInformation, bio: event.target.value },
            }))
          }
          placeholder={t("Introduce your creative background, target audience, and notable work.")}
          className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:bg-white"
        />
        <p className="mt-2 text-right text-xs text-[#94a3b8]">{draft.creativeInformation.bio.length} / 1000</p>
      </div>
    </SectionCard>
  );
}

function StepIdentity({
  draft,
  onChange,
  token,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
  token?: string | null;
}) {
  const { t } = useCreatorI18n();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const verificationOptions =
    draft.basicInformation.creatorType === "company"
      ? VERIFICATION_OPTIONS.filter((option) => option.value === "business_license")
      : VERIFICATION_OPTIONS.filter((option) => option.value !== "business_license");
  const showSecondaryUpload =
    draft.basicInformation.creatorType === "individual" && draft.identityVerification.verificationType === "government_id";

  async function persistIdentityDraft(updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) {
    const nextDraft = {
      ...updater(draft),
      updatedAt: new Date().toISOString(),
    };

    if (token) {
      await creatorApi.saveApplicationDraft(token, nextDraft);
    }

    onChange(() => nextDraft);
    return nextDraft;
  }

  async function handleDocumentSelect(target: "front" | "back", file: File) {
    if (!token) {
      throw new Error(t("Please sign in again before uploading files."));
    }

    const uploaded = await creatorApi.uploadApplicationDocument(token, file);
    const nameField = target === "front" ? "frontDocumentFileName" : "backDocumentFileName";
    const urlField = target === "front" ? "frontDocumentFileUrl" : "backDocumentFileUrl";

    try {
      await persistIdentityDraft((current) => ({
        ...current,
        identityVerification: {
          ...current.identityVerification,
          [nameField]: uploaded.data.filename,
          [urlField]: uploaded.data.url,
        },
      }));
    } catch (error) {
      try {
        await creatorApi.deleteApplicationDocument(token, uploaded.data.url);
      } catch {
        // Ignore cleanup failures and surface the original error.
      }
      throw error;
    }
  }

  async function handleDocumentRemove(target: "front" | "back") {
    const nameField = target === "front" ? "frontDocumentFileName" : "backDocumentFileName";
    const urlField = target === "front" ? "frontDocumentFileUrl" : "backDocumentFileUrl";
    const existingUrl = target === "front" ? draft.identityVerification.frontDocumentFileUrl : draft.identityVerification.backDocumentFileUrl;

    if (existingUrl && token) {
      await creatorApi.deleteApplicationDocument(token, existingUrl);
    }

    await persistIdentityDraft((current) => ({
      ...current,
      identityVerification: {
        ...current.identityVerification,
        [nameField]: "",
        [urlField]: "",
      },
    }));
  }

  return (
    <SectionCard
      title={t("Identity verification")}
      description={
        draft.basicInformation.creatorType === "company"
          ? t("Upload the company registration document used to verify the legal entity before creator access is activated.")
          : t("Upload the identity document that matches your creator profile. TinyTale uses this to verify the applicant before uploads and payouts are enabled.")
      }
    >
      <div>
        <FieldLabel>{t("Verification Document")}</FieldLabel>
        <div className={`grid gap-3 ${verificationOptions.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {verificationOptions.map((option) => {
            const active =
              draft.basicInformation.creatorType === "company"
                ? option.value === "business_license"
                : draft.identityVerification.verificationType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    identityVerification: {
                      ...current.identityVerification,
                      verificationType: option.value,
                    },
                  }))
                }
                className={`rounded-2xl border-2 p-3.5 text-left transition ${
                  active ? "border-[#1876f2] bg-[#eff6ff]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                }`}
              >
                <p className={`text-sm font-bold ${active ? "text-[#1d4ed8]" : "text-[#0f172a]"}`}>{t(option.title)}</p>
                <p className="mt-1 text-xs leading-5 text-[#64748b]">{t(option.description)}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid gap-4 ${showSecondaryUpload ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          <UploadCard
            label={getIdentityPrimaryUploadLabel(draft, t)}
          fileName={draft.identityVerification.frontDocumentFileName}
          fileUrl={draft.identityVerification.frontDocumentFileUrl}
          inputRef={frontInputRef}
          onSelect={(file) => handleDocumentSelect("front", file)}
          onRemove={() => handleDocumentRemove("front")}
        />
        {showSecondaryUpload ? (
          <UploadCard
            label={getIdentitySecondaryUploadLabel(draft, t)}
            fileName={draft.identityVerification.backDocumentFileName}
            fileUrl={draft.identityVerification.backDocumentFileUrl}
            inputRef={secondaryInputRef}
            onSelect={(file) => handleDocumentSelect("back", file)}
            onRemove={() => handleDocumentRemove("back")}
          />
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-sm leading-6 text-[#1e3a8a]">
        {draft.basicInformation.creatorType === "company"
          ? t("Company accounts submit one registration file in this step. Registration ID, address, country, and region stay linked to the first step and are preserved when you move backward.")
          : draft.identityVerification.verificationType === "passport"
            ? t("Passport verification requires one passport image or PDF. Your Step 1 identity details stay intact if you go back to edit them.")
            : t("Government ID verification requires both the front and back of the ID card. Your Step 1 profile details stay intact if you go back to edit them.")}
      </div>
    </SectionCard>
  );
}

function UploadCard({
  label,
  fileName,
  fileUrl,
  inputRef,
  onSelect,
  onRemove,
  optional,
}: {
  label: string;
  fileName: string;
  fileUrl?: string;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onSelect: (file: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  optional?: boolean;
}) {
  const { t } = useCreatorI18n();
  const [busy, setBusy] = useState<"uploading" | "removing" | null>(null);
  const [error, setError] = useState("");
  const hasFile = Boolean(fileName || fileUrl);
  const previewIsImage = isImageDocument(fileName, fileUrl);
  const previewIsPdf = isPdfDocument(fileName, fileUrl);

  async function handleSelection(file: File) {
    setBusy("uploading");
    setError("");
    try {
      await onSelect(file);
    } catch (selectError: any) {
      setError(selectError?.message || t("Upload failed. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    if (!onRemove) return;
    setBusy("removing");
    setError("");
    try {
      await onRemove();
    } catch (removeError: any) {
      setError(removeError?.message || t("Failed to remove file. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <button
        type="button"
        disabled={busy !== null}
        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center transition hover:border-[#93c5fd] hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-70"
        onClick={() => inputRef.current?.click()}
      >
        {busy === "uploading" ? <Loader2 className="h-6 w-6 animate-spin text-[#1876f2]" /> : <Upload className="h-6 w-6 text-[#94a3b8]" />}
        <p className="mt-2 text-sm font-semibold text-[#334155]">{busy === "uploading" ? t("Uploading...") : fileName || t("Select __ARG_0__", label)}</p>
        <p className="mt-1 text-xs text-[#94a3b8]">{t("JPG, PNG, or PDF up to 10MB")}</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleSelection(file);
          }
          event.currentTarget.value = "";
        }}
      />
      {error ? <p className="mt-2 text-xs font-medium text-[#dc2626]">{error}</p> : null}
      {hasFile ? (
        <div className="mt-3 rounded-2xl border border-[#dbe2ea] bg-white p-3 shadow-sm">
          <div className="flex items-start gap-3">
            {previewIsImage && fileUrl ? (
              <img
                src={fileUrl}
                alt={t("Uploaded file")}
                className="h-16 w-16 rounded-xl border border-[#e2e8f0] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#475569]">
                <FileText className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{t("Uploaded file")}</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#0f172a]">{fileName || label}</p>
              <p className="mt-1 text-xs text-[#64748b]">{previewIsPdf ? "PDF" : previewIsImage ? t("Image") : t("Document")}</p>
              {fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1876f2] hover:text-[#1669da]"
                >
                  {t("Open file")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>

            {onRemove ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={handleRemove}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#fecaca] bg-[#fff1f2] text-[#dc2626] transition hover:bg-[#ffe4e6] disabled:cursor-not-allowed disabled:opacity-70"
                aria-label={t("Remove file")}
                title={t("Remove file")}
              >
                {busy === "removing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepAgreement({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const agreementCopy = resolveLocaleCopy(CREATOR_AGREEMENT_COPY, locale);
  const agreementRef = useRef<HTMLDivElement>(null);

  function markAgreementReviewed() {
    if (draft.agreement.hasReviewedFullAgreement) return;
    onChange((current) => ({
      ...current,
      agreement: { ...current.agreement, hasReviewedFullAgreement: true },
    }));
  }

  return (
    <SectionCard
      title={t("Creator agreement")}
      description={t("The creator agreement must be reviewed in-page. TinyTale records the acceptance timestamp once you submit the application.")}
    >
      <div className="rounded-[24px] border border-[#e2e8f0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
            <FileText className="h-4 w-4 text-[#64748b]" />
            {t("TinyTale Creator Cooperation Agreement")}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.agreement.hasReviewedFullAgreement ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#eff6ff] text-[#1d4ed8]"}`}>
            {draft.agreement.hasReviewedFullAgreement ? t("Reviewed") : t("Scroll to review")}
          </span>
        </div>
        <div
          ref={agreementRef}
          onScroll={(event) => {
            const target = event.currentTarget;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 12) {
              markAgreementReviewed();
            }
          }}
          className="max-h-[420px] space-y-5 overflow-y-auto px-4 py-4 text-sm leading-7 text-[#334155]"
        >
          <p className="font-medium text-[#0f172a]">{agreementCopy.intro}</p>

          {agreementCopy.sections.map((section) => (
            <AgreementSection key={section.title} title={section.title}>
              {section.blocks.map((block, index) =>
                block.type === "paragraph" ? (
                  <p key={`${section.title}-paragraph-${index}`}>{block.text}</p>
                ) : (
                  <ul key={`${section.title}-bullets-${index}`} className="list-disc space-y-1 pl-5">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              )}
            </AgreementSection>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-[24px] border border-[#e2e8f0] bg-white p-4">
        <label className="flex items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.agreement.acceptedTerms}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                agreement: { ...current.agreement, acceptedTerms: event.target.checked },
              }))
            }
            className="mt-1 h-4 w-4 rounded border-[#cbd5e1] text-[#1876f2]"
          />
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">{t("I have read and agree to the TinyTale Creator Cooperation Agreement.")}</p>
            <p className="mt-1 text-sm text-[#64748b]">{t("You must review the agreement above before this checkbox is considered valid.")}</p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.agreement.acceptedAuthenticity}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                agreement: { ...current.agreement, acceptedAuthenticity: event.target.checked },
              }))
            }
            className="mt-1 h-4 w-4 rounded border-[#cbd5e1] text-[#1876f2]"
          />
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">{t("I confirm the submitted content and materials are authentic and rights-cleared.")}</p>
            <p className="mt-1 text-sm text-[#64748b]">{t("This includes portfolio links, uploaded identity files, and future drama uploads.")}</p>
          </div>
        </label>

        <InputField
          label={t("Signature Name")}
          value={draft.agreement.signatureName}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              agreement: { ...current.agreement, signatureName: value },
            }))
          }
          placeholder={t("Type your full legal or representative name")}
          icon={<BadgeCheck className="h-4 w-4" />}
        />
      </div>
    </SectionCard>
  );
}

function AgreementSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-bold text-[#0f172a]">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function StepReview({
  draft,
  onEdit,
  onSubmit,
  onSaveDraft,
  submitting,
  savingDraft,
}: {
  draft: CreatorApplicationDraft;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onSaveDraft: () => Promise<void> | void;
  submitting: boolean;
  savingDraft: boolean;
}) {
  const { t } = useCreatorI18n();
  const primaryName = draft.basicInformation.creatorType === "company" ? draft.basicInformation.companyName || "-" : draft.basicInformation.legalName || "-";

  return (
    <div className="space-y-5">
      <ReviewCard title={t("Basic Information")} icon={<User className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(1)}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewField label={t("Applicant Type")} value={draft.basicInformation.creatorType === "company" ? t("Company / Studio") : t("Individual Creator")} />
          <ReviewField label={draft.basicInformation.creatorType === "company" ? t("Company Name") : t("Full Name")} value={primaryName} />
          {draft.basicInformation.creatorType === "company" ? (
            <>
              <ReviewField label={t("Business Type")} value={draft.basicInformation.businessType || "-"} />
              <ReviewField label={t("Registration ID")} value={draft.basicInformation.registrationId || "-"} />
              <ReviewField label={t("Company Address")} value={draft.basicInformation.companyAddress || "-"} />
              <ReviewField label={t("Region")} value={draft.basicInformation.region || "-"} />
            </>
          ) : (
            <>
              <ReviewField label={t("Age")} value={draft.basicInformation.age || "-"} />
              <ReviewField label={t("ID Number")} value={draft.basicInformation.idNumber || "-"} />
            </>
          )}
          <ReviewField label={t("Email")} value={draft.basicInformation.email || "-"} />
          <ReviewField label={t("Phone Number")} value={draft.basicInformation.phone || "-"} />
          <ReviewField label={t("Country / Region")} value={draft.basicInformation.country || "-"} />
        </div>
      </ReviewCard>

      <ReviewCard title={t("Creative Profile")} icon={<Globe2 className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(2)}>
        <ReviewField label={t("Genres")} value={draft.creativeInformation.genres.map((genre) => t(genre)).join(", ") || "-"} />
        <ReviewField label={t("Primary Language")} value={draft.creativeInformation.primaryLanguage ? t(draft.creativeInformation.primaryLanguage) : "-"} />
        <ReviewField label={t("Portfolio Links")} value={draft.creativeInformation.portfolioLinks.filter((value) => value.trim()).join("\n") || "-"} preserveLineBreaks />
        <ReviewField label={t("Creator Bio / Studio Introduction")} value={draft.creativeInformation.bio || "-"} preserveLineBreaks />
      </ReviewCard>

      <ReviewCard title={t("Identity Verification")} icon={<ShieldCheck className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(3)}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewField label={t("Verification Document")} value={getIdentityVerificationTitle(draft, t)} />
          <ReviewField label={getIdentityPrimaryUploadLabel(draft, t)} value={draft.identityVerification.frontDocumentFileName || "-"} />
          {draft.basicInformation.creatorType === "individual" && draft.identityVerification.verificationType === "government_id" ? (
            <ReviewField label={getIdentitySecondaryUploadLabel(draft, t)} value={draft.identityVerification.backDocumentFileName || "-"} />
          ) : null}
        </div>
      </ReviewCard>

      <ReviewCard title={t("Agreement Confirmation")} icon={<FileText className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(4)}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewField label={t("Agreement Reviewed")} value={draft.agreement.hasReviewedFullAgreement ? t("Yes") : t("No")} />
          <ReviewField label={t("Rights Confirmed")} value={draft.agreement.acceptedAuthenticity ? t("Yes") : t("No")} />
          <ReviewField label={t("Agreement Accepted")} value={draft.agreement.acceptedTerms ? t("Yes") : t("No")} />
          <ReviewField label={t("Signature Name")} value={draft.agreement.signatureName || "-"} />
        </div>
      </ReviewCard>

      <div className="rounded-[24px] bg-[#0f172a] px-5 py-6 text-white shadow-[0_20px_40px_rgba(15,23,42,0.22)] md:px-6">
        <h3 className="text-lg font-bold">{t("Submit for manual review")}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cbd5e1]">
          {t("TinyTale will manually review the application, creator profile, identity materials, and agreement confirmation before enabling the creator dashboard. Review SLA target is within 48 hours.")}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {savingDraft ? t("Saving Draft...") : t("Save Draft")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0f172a] hover:bg-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? `${t("Submitting")}...` : t("Submit Application")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const { t } = useCreatorI18n();
  return (
    <div className="rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
          {icon}
          {title}
        </div>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#1876f2] hover:text-[#1669da]">
          {t("Edit")}
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ReviewField({ label, value, preserveLineBreaks }: { label: string; value: string; preserveLineBreaks?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{label}</p>
      <p className={`text-sm font-medium text-[#0f172a] ${preserveLineBreaks ? "whitespace-pre-line" : ""}`}>{value || "-"}</p>
    </div>
  );
}
