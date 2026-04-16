import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocaleHref, getPreferredLocale, LOCALE_COOKIE_NAME } from '@/lib/i18n';

export default async function IndexPage() {
  const cookieStore = await cookies();
  const locale = getPreferredLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  redirect(getLocaleHref(locale));
}
