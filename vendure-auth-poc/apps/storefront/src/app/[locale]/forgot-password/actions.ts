'use server';

import {channelRequestPasswordReset} from '@/lib/vendure/channel-auth';
import {getTranslations} from 'next-intl/server';

export async function requestPasswordResetAction(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const emailAddress = formData.get('emailAddress') as string;

    if (!emailAddress) {
        return {error: t('emailRequired')};
    }

    try {
        const result = await channelRequestPasswordReset(emailAddress);
        const resetResult = result.data.channelRequestPasswordReset;

        if (!resetResult.success) {
            return {error: resetResult.message || t('failedPasswordReset')};
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}
