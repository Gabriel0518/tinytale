'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { localizePath, SupportedLocale } from '@/lib/i18n';
import { useLocale } from '@/hooks/useLocale';

const FOOTER_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: {
    company: 'Company',
    about: 'About',
    careers: 'Careers',
    press: 'Press',
    support: 'Support',
    helpCenter: 'Help Center',
    contact: 'Contact',
    faq: 'FAQ',
    legal: 'Legal',
    terms: 'Terms',
    privacy: 'Privacy',
    cookies: 'Cookie Policy',
    followUs: 'Follow Us',
    tagline: 'Watch premium short dramas anytime, anywhere.',
    rights: 'All rights reserved.',
    localeLabel: 'English (US)' },
  zh: {
    company: '公司',
    about: '关于我们',
    careers: '加入我们',
    press: '媒体',
    support: '支持',
    helpCenter: '帮助中心',
    contact: '联系我们',
    faq: '常见问题',
    legal: '法律',
    terms: '条款',
    privacy: '隐私',
    cookies: 'Cookie 政策',
    followUs: '关注我们',
    tagline: '随时随地观看高品质短剧。',
    rights: '版权所有。',
    localeLabel: '中文' },
  ja: {
    company: '会社情報',
    about: '会社概要',
    careers: '採用情報',
    press: 'プレス',
    support: 'サポート',
    helpCenter: 'ヘルプセンター',
    contact: 'お問い合わせ',
    faq: 'FAQ',
    legal: '法務',
    terms: '利用規約',
    privacy: 'プライバシー',
    cookies: 'Cookie ポリシー',
    followUs: 'フォロー',
    tagline: 'いつでもどこでもプレミアム短編ドラマ。',
    rights: 'All rights reserved.',
    localeLabel: '日本語' },
  es: {
    company: 'Compañía',
    about: 'Acerca de',
    careers: 'Empleo',
    press: 'Prensa',
    support: 'Soporte',
    helpCenter: 'Centro de ayuda',
    contact: 'Contacto',
    faq: 'FAQ',
    legal: 'Legal',
    terms: 'Términos',
    privacy: 'Privacidad',
    cookies: 'Política de cookies',
    followUs: 'Síguenos',
    tagline: 'Disfruta dramas cortos premium en cualquier momento.',
    rights: 'Todos los derechos reservados.',
    localeLabel: 'Español' },
  pt: {
    company: 'Empresa',
    about: 'Sobre',
    careers: 'Carreiras',
    press: 'Imprensa',
    support: 'Suporte',
    helpCenter: 'Central de ajuda',
    contact: 'Contato',
    faq: 'FAQ',
    legal: 'Legal',
    terms: 'Termos',
    privacy: 'Privacidade',
    cookies: 'Política de cookies',
    followUs: 'Siga-nos',
    tagline: 'Assista dramas curtos premium a qualquer hora.',
    rights: 'Todos os direitos reservados.',
    localeLabel: 'Português' },
  hi: {
    company: 'कंपनी',
    about: 'हमारे बारे में',
    careers: 'करियर',
    press: 'प्रेस',
    support: 'सपोर्ट',
    helpCenter: 'सहायता केंद्र',
    contact: 'संपर्क',
    faq: 'FAQ',
    legal: 'कानूनी',
    terms: 'नियम',
    privacy: 'गोपनीयता',
    cookies: 'कुकी नीति',
    followUs: 'हमें फॉलो करें',
    tagline: 'कभी भी, कहीं भी प्रीमियम शॉर्ट ड्रामा देखें।',
    rights: 'सर्वाधिकार सुरक्षित।',
    localeLabel: 'हिंदी' },
  id: {
    company: 'Perusahaan',
    about: 'Tentang',
    careers: 'Karier',
    press: 'Pers',
    support: 'Dukungan',
    helpCenter: 'Pusat bantuan',
    contact: 'Kontak',
    faq: 'FAQ',
    legal: 'Legal',
    terms: 'Ketentuan',
    privacy: 'Privasi',
    cookies: 'Kebijakan cookie',
    followUs: 'Ikuti kami',
    tagline: 'Tonton drama pendek premium kapan saja.',
    rights: 'Hak cipta dilindungi.',
    localeLabel: 'Indonesia' } };

const SOCIAL_ICONS: Record<string, { label: string; icon: JSX.Element }> = {
  social_whatsapp: {
    label: 'WhatsApp',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ) },
  social_telegram: {
    label: 'Telegram',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ) },
  social_discord: {
    label: 'Discord',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
      </svg>
    ) },
  social_x: {
    label: 'X',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ) },
  social_instagram: {
    label: 'Instagram',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ) },
  social_youtube: {
    label: 'YouTube',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ) } };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7002';

export function Footer() {
  const locale = useLocale();
  const t = FOOTER_TEXT[locale] || FOOTER_TEXT.en;
  const [socialLinks, setSocialLinks] = useState<{ key: string; url: string }[]>([]);

  const footerSections = useMemo(() => ([
    {
      title: t.company,
      links: [
        { label: t.about, href: '/help?tab=about&section=mission' },
        { label: t.careers, href: '/help?tab=about&section=careers' },
        { label: t.press, href: '/help?tab=about&section=press' },
      ] },
    {
      title: t.support,
      links: [
        { label: t.helpCenter, href: '/help' },
        { label: t.contact, href: '/help?section=contact-section' },
        { label: t.faq, href: '/help?tab=faq&section=faq-account' },
      ] },
    {
      title: t.legal,
      links: [
        { label: t.terms, href: '/help?tab=terms&section=tos-intro' },
        { label: t.privacy, href: '/help?tab=privacy&section=pp-intro' },
        { label: t.cookies, href: '/help?tab=privacy&section=pp-cookies' },
      ] },
  ]), [t]);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/social`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res.data) {
          const links = Object.entries(res.data)
            .filter(([, url]) => typeof url === 'string' && (url as string).trim() !== '')
            .map(([key, url]) => ({ key, url: url as string }));
          setSocialLinks(links);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-gray-800 bg-[#0a0a0a] py-12 mt-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Logo */}
        <div className="mb-8">
          <Image src="/logo.png" alt="TinyTale" width={420} height={108} className="h-16 w-auto" />
          <p className="mt-3 text-sm text-gray-500">
            {t.tagline}
          </p>
        </div>

        {/* Grid sections */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </h4>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={localizePath(link.href, locale)}
                    className="block text-sm text-gray-500 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Follow Us - only show if there are configured social links */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {t.followUs}
              </h4>
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const meta = SOCIAL_ICONS[social.key];
                  if (!meta) return null;
                  return (
                    <a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 transition hover:text-white"
                      aria-label={meta.label}
                    >
                      {meta.icon}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} TinyTale. {t.rights}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>{t.localeLabel}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
