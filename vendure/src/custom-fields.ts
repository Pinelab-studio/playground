import { CustomFields } from '@vendure/core';

export const customFields: CustomFields = {
    // Product: [
    //     { name: 'metaDescription', type: 'text' },
    // ],
};

declare module '@vendure/core' {
    interface CustomProductFields {
        metaDescription: string | null;
    }
}
