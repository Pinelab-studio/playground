'use server';

import {channelResetPassword} from '@/lib/vendure/channel-auth';
import {redirect} from '@/i18n/navigation';
import {getLocale, getTranslations} from 'next-intl/server';

export async function resetPasswordAction(prevState: { error?: string } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || !confirmPassword) {
        return {error: t('fieldsRequired')};
    }

    if (password !== confirmPassword) {
        return {error: t('passwordsMismatch')};
    }

    try {
        const result = await channelResetPassword(token, password);
        const resetResult = result.data.channelResetPassword;

        if (!resetResult.success) {
            return {error: resetResult.message || t('failedPasswordReset')};
        }

        const locale = await getLocale();
        redirect({href: '/sign-in', locale});
    } catch {
        return {error: t('unexpectedError')};
    }
}
