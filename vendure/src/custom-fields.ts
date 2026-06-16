import { CustomFields } from '@vendure/core';

export const customFields: CustomFields = {
    // Product: [
    //     { name: 'metaDescription', type: 'text' },
    // ],
};

// This ensures typescript will see product.customFields.metaDescription as string | undefined
declare module '@vendure/core' {
    interface CustomProductFields {
        metaDescription?: string;
    }
}
