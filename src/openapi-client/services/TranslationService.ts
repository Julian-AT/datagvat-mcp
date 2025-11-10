/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TranslationService {
    /**
     * Post a completed translation.
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized for this operation. As an authorized user you can add a completed translation for catalogues, datasets, distributions.
     * @param requestBody JSON with the completed translations.
     * @returns void
     * @throws ApiError
     */
    public static postTranslation(
        requestBody: Record<string, any>,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/translation',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Resource not found`,
            },
        });
    }
}
