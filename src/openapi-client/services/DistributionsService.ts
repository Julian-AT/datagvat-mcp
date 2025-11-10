/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RDFXML } from '../models/RDFXML';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DistributionsService {
    /**
     * Get distribution
     * You can get a specific distribution of a dataset making a GET request to the specified URL of the API endpoint with the resource path "/distributions/{distributionId}" at the end of the URL, set the unique ID of the distribution as {distributionId} element of the URL.
     * @param distributionId The distribution id
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getDistribution(
        distributionId: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/distributions/{distributionId}',
            path: {
                'distributionId': distributionId,
            },
            errors: {
                404: `Distribution not found`,
            },
        });
    }
    /**
     * Headers only for "Get distribution"
     * To retrieve only the headers for a specific distribution of a dataset make a HEAD request to the specified URL of the API endpoint with the resource path "/distributions/{distributionId}" at the end of the URL, set the unique ID of the distribution as {distributionId} element of the URL.
     * @param distributionId The distribution id
     * @returns any Headers of get distribution
     * @throws ApiError
     */
    public static headGetDistribution(
        distributionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/distributions/{distributionId}',
            path: {
                'distributionId': distributionId,
            },
            errors: {
                404: `Distribution Not Found`,
            },
        });
    }
    /**
     * Update distribution
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to create or update a dataset's distribution. As an authorized user, you make a PUT request to the specified URL of the API endpoint with the resource path "/distributions/{distributionId}" at the end of the URL. Specify the unique ID of the distribution as the {distributionId}. If the distribution with this ID already exists, it will be updated. If the distribution ID is new, a new distribution will be created.
     * @param distributionId The distribution id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static putDistribution(
        distributionId: string,
        requestBody: RDFXML,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/distributions/{distributionId}',
            path: {
                'distributionId': distributionId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Distribution Not Found`,
            },
        });
    }
    /**
     * Delete distribution
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can delete a specific distribution. Send a DELETE request to the specified URL of the API endpoint with the resource path "/distributions/{distributionId}" at the end of the URL. Specify the unique ID of the distribution as the {distributionId}. The specified distribution will be deleted.
     * @param distributionId The distribution id
     * @returns void
     * @throws ApiError
     */
    public static deleteDistribution(
        distributionId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/distributions/{distributionId}',
            path: {
                'distributionId': distributionId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Distribution Not Found`,
            },
        });
    }
}
