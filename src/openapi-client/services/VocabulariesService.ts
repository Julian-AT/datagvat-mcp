/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RDFXML } from '../models/RDFXML';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VocabulariesService {
    /**
     * Get list of vocabularies
     * You can get a list of indexed (controlled) vocabularies used by the portal sending a GET request to the specified URL of the API endpoint with the resource path "/vocabularies" at the end of the URL. Upon success, the response will contain, by default, an array with the URLs of the chosen number of vocabularies (with 100 being the default limit). To retrieve identifiers (normalized IDs), metadata etc. you can choose a different value for the parameter "valueType".
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns string The list of resource(s)
     * @throws ApiError
     */
    public static listVocabularies(
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/vocabularies',
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Head get list of vocabularies
     * To retrieve only the headers for the list of indexed (controlled) vocabularies used by the portal sending a HEAD request to the specified URL of the API endpoint with the resource path "/vocabularies" at the end of the URL. Upon success, the response will contain, by default, the headers for chosen number of the vocabularies' URLs (with 100 being default limit). To retrieve headers for other data of the vocabularies select a different value for the parameter "valueType".
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns any Headers of list vocabularies
     * @throws ApiError
     */
    public static headListVocabularies(
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/vocabularies',
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @deprecated
     * Create or Update a vocabulary
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized for this operation. As an authorized user you can create or update a vocabulary, sending a PUT request to the specified API endpoint URL with the resource path "/vocabularies" at the end of the URL. Set the unique ID and URI of the vocabulary as required parameters of the request, if the vocabulary ID and URI already exist, the vocabulary is updated.
     * @param vocabularyId ID of the vocabulary
     * @param uri URI of the vocabulary
     * @param requestBody
     * @param hash Hash of the vocabulary. Used for chunk-wise processing. Default is empty.
     * @param chunkId Id of the corresponding chunk of the vocabulary. Used for chunk-wise processing. Default is 0.
     * @param numberOfChunks Number of total chunks of the vocabulary. Used for chunk-wise processing. Default is 1.
     * @returns string Vocabulary created
     * @returns any Vocabulary chunk accepted
     * @throws ApiError
     */
    public static createOrUpdateVocabulary(
        vocabularyId: string,
        uri: string,
        requestBody: RDFXML,
        hash?: string,
        chunkId?: number,
        numberOfChunks?: number,
    ): CancelablePromise<string | any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/vocabularies',
            query: {
                'vocabularyId': vocabularyId,
                'uri': uri,
                'hash': hash,
                'chunkId': chunkId,
                'numberOfChunks': numberOfChunks,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get a vocabulary
     * You can get a vocabulary, making a GET request to the specified URL of the API endpoint with the resource path "/vocabularies/{vocabularyId}". Set the unique identifier of the vocabulary as {vocabularyId} element of the URL. If successful, the response contains the vocabulary.
     * @param vocabularyId The vocabulary id
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getVocabulary(
        vocabularyId: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/vocabularies/{vocabularyId}',
            path: {
                'vocabularyId': vocabularyId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Head get a vocabulary
     * You can get only the headers for a vocabulary making a HEAD request to the specified URL of the API endpoint with the resource path  "/vocabularies/{vocabularyId}". Set the unique identifier of the vocabulary as {vocabularyId} element of the URL. If successful, the response contains the headers of the specified vocabulary.
     * @param vocabularyId The vocabulary id
     * @returns any Headers of get a vocabulary
     * @throws ApiError
     */
    public static headGetVocabulary(
        vocabularyId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/vocabularies/{vocabularyId}',
            path: {
                'vocabularyId': vocabularyId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Create or update a vocabulary
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized for this operation. As an authorized user you can create or update a vocabulary, sending a PUT request to the specified URL of the API endpoint "/vocabularies/{vocabularyId}". Set the unique identifier of the vocabulary as {vocabularyId} element of the URL. If the vocabulary ID already exists, the vocabulary is updated.  If the vocabulary ID is new, a new vocabulary will be created
     * @param vocabularyId The vocabulary id
     * @param requestBody
     * @returns string Vocabulary created
     * @throws ApiError
     */
    public static putVocabulary(
        vocabularyId: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/vocabularies/{vocabularyId}',
            path: {
                'vocabularyId': vocabularyId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete a vocabulary
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized for this operation. As an authorized user you can delete a vocabulary, sending a DELETE request to the specified URL of the API endpoint with the resource path "/vocabularies/{vocabularyId}" added at the end of the URL. Set the unique ID of the vocabulary as {vocabularyId} element of the URL. Caution! You cannot revert this operation.
     * @param vocabularyId The vocabulary id
     * @returns void
     * @throws ApiError
     */
    public static deleteVocabulary(
        vocabularyId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/vocabularies/{vocabularyId}',
            path: {
                'vocabularyId': vocabularyId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
