/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RDFXML } from '../models/RDFXML';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DraftsService {
    /**
     * Get dataset drafts
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to retrieve drafts of datasets. As an authorized user, you make a GET request to the specified API endpoint URL with the resource path "/drafts/datasets" added at the end of the URL. If successful, the response contains an array of the drafts' ID that the user is authorized to read, update and delete.
     * @param filterByProvider By default, all drafts that the user is allowed to read, update and delete are returned. With `filterByProvider=true` only drafts that the user has created are returned.
     * @returns string Request accepted.
     * @throws ApiError
     */
    public static listDatasetDrafts(
        filterByProvider?: boolean,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/drafts/datasets',
            query: {
                'filterByProvider': filterByProvider,
            },
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Create a dataset draft
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to create a draft of a dataset. As an authorized user, you make a POST request to the specified URL of the API endpoint with the resource path "/drafts/datasets" added at the end of the URL. The ID of the catalogue, where the draft is added, is a required query parameter. If successful, the draft ID will be created automatically.
     * @param catalogue The ID of the catalogue which should contain this dataset draft
     * @returns any Dataset created.
     * @throws ApiError
     */
    public static createDatasetDraft(
        catalogue: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/drafts/datasets',
            query: {
                'catalogue': catalogue,
            },
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Get a dataset draft
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to get a dataset draft. As an authorized user, you make a GET request to the specified URL of the API endpoint with the resource path "/drafts/datasets/{id}" at the end of the URL, set the unique ID of the draft as {id} element of the URL.
     * @param id ID of the draft dataset.
     * @param catalogue The ID of the catalogue which should contain this dataset draft
     * @returns string Request accepted.
     * @throws ApiError
     */
    public static readDatasetDraft(
        id: string,
        catalogue: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/drafts/datasets/{id}',
            path: {
                'id': id,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                400: `Invalid request.`,
                404: `Catalogue or Dataset Draft ID not found.`,
            },
        });
    }
    /**
     * Create or Update a dataset draft
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to create or update a dataset draft with given ID. As an authorized user, you make a PUT request to the specified URL of the API endpoint with the resource path "/drafts/datasets/{id}" added at the end of the URL, set the unique ID of the draft as {id} element of the URL. If the request is successful and the ID already exists, the information in the draft will be updated with the newly provided information. If the ID is new, a new draft will be created.
     * @param id ID of the draft dataset.
     * @param catalogue The ID of the catalogue which should contain this dataset draft
     * @param requestBody
     * @returns any Dataset created.
     * @throws ApiError
     */
    public static createOrUpdateDatasetDraft(
        id: string,
        catalogue: string,
        requestBody: RDFXML,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/drafts/datasets/{id}',
            path: {
                'id': id,
            },
            query: {
                'catalogue': catalogue,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Delete a dataset draft
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to delete a dataset draft. As an authorized user, you make a DELETE request to the specified URL of the API endpoint with the resource path "/drafts/datasets/{id}" at the end of the URL, set the unique ID of the draft as {id} element of the URL.  Caution: you cannot revert this operation
     * @param id ID of the draft dataset.
     * @param catalogue The ID of the catalogue which should contain this dataset draft
     * @returns any Request accepted.
     * @throws ApiError
     */
    public static deleteDatasetDraft(
        id: string,
        catalogue: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/drafts/datasets/{id}',
            path: {
                'id': id,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                404: `Dataset ID not found.`,
            },
        });
    }
    /**
     * Publish a dataset draft
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to publish a dataset draft. As an authorized user, you make a PUT request to the specified URL of the API endpoint with the resource path "/drafts/datasets/publish/{id}" added at the end of the URL, set the unique ID of the specified draft as {id} element of the URL. If successful, the draft is published and gets another ID as dataset.
     * @param id ID of the draft dataset.
     * @param catalogue The ID of the catalogue which should contain this dataset draft
     * @returns void
     * @throws ApiError
     */
    public static publishDatasetDraft(
        id: string,
        catalogue: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/drafts/datasets/publish/{id}',
            path: {
                'id': id,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Hide a published dataset
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to withdraw a published dataset from publication, by setting it into draft. As an authorized user, you make a PUT request to the specified URL of the API endpoint with the resource path "/drafts/datasets/hide/{id}" at the end of the URL, set the unique ID of the specified dataset as {id} element of the URL. If successful, the dataset is retracted and set to the drafts.
     * @param id ID of the published dataset.
     * @param catalogue The ID of the catalogue which should contain this dataset draft
     * @returns void
     * @throws ApiError
     */
    public static hideDataset(
        id: string,
        catalogue: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/drafts/datasets/hide/{id}',
            path: {
                'id': id,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                400: `Invalid request.`,
            },
        });
    }
}
