'use server';

import {channelAuthenticate} from '@/lib/vendure/channel-auth';
import {mutate} from '@/lib/vendure/api';
import {LogoutMutation} from '@/lib/vendure/mutations';
import {removeAuthToken, setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {revalidatePath} from "next/cache";
import {getLocale, getTranslations} from 'next-intl/server';

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    const result = await channelAuthenticate(username, password);
    const authResult = result.data.authenticate;

    if (authResult.__typename !== 'CurrentUser') {
        if (authResult.__typename === 'NotVerifiedError') {
            return { error: t('verifyEmailFirst') };
        }
        return { error: t('invalidCredentials') };
    }

    if (result.token) {
        await setAuthToken(result.token);
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}`, 'layout');

    const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/';

    redirect({href: safeRedirect, locale});
}

export async function logoutAction() {
    await mutate(LogoutMutation);
    await removeAuthToken();

    const locale = await getLocale();
    redirect({href: '/', locale})
}
