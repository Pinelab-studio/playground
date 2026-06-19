'use server';

import {channelRegister} from '@/lib/vendure/channel-auth';
import {redirect} from '@/i18n/navigation';
import {getLocale, getTranslations} from 'next-intl/server';

export async function registerAction(prevState: { error?: string } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const emailAddress = formData.get('emailAddress') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    if (!emailAddress || !password) {
        return {error: t('emailPasswordRequired')};
    }

    const result = await channelRegister({
        emailAddress,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
    });

    const registerResult = result.data.channelRegisterCustomer;

    if (!registerResult.success) {
        return {error: registerResult.message || 'Registration failed'};
    }

    const locale = await getLocale();
    const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/sign-in';
    redirect({href: safeRedirect, locale});
}
