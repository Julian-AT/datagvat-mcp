/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IdentifiersService {
    /**
     * Create a persistent identifier for a dataset
     * This function is reserved for internal use only and is not part of our public API offerings. This endpoint allows to create a persistent identifier for a dataset, that will be stored in the adms:identifier property. Choose value "mock" for the query parameter type if you need it for simulation purpose.
     * @param datasetId The dataset id
     * @param type The type of the persistent identifier
     * @param catalogue The the catalogue id to which the dataset belongs
     * @returns any Identifier created, details in the response body
     * @throws ApiError
     */
    public static createDatasetIdentifier(
        datasetId: string,
        type: 'eu-ra-doi' | 'mock',
        catalogue?: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/identifiers/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
                'type': type,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset not found`,
                422: `Unprocessable Entity, details in the response body.`,
            },
        });
    }
    /**
     * Check if an identifier can be issued for the given dataset.
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can check if the specified dataset has all required elements ("creator", "publisher" etc.) to obtain an identifier. Send a GET request to the specified API endpoint URL with the resource path "/identifiers/datasets/{datasetId}/eligibility" added at the end of the URL,  set the unique ID of the dataset as {datasetID} element of the URL. Choose value "mock" for the query parameter type if you need it for simulation purpose.
     * @param datasetId The dataset id
     * @param catalogue The the catalogue id to which the dataset belongs
     * @param type The type of the persistent identifier
     * @returns any Eligible or not
     * @throws ApiError
     */
    public static checkIdentifierEligibility(
        datasetId: string,
        catalogue?: string,
        type?: 'eu-ra-doi' | 'mock',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/identifiers/datasets/{datasetId}/eligibility',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
                'type': type,
            },
            errors: {
                404: `The dataset was not found`,
            },
        });
    }
}
