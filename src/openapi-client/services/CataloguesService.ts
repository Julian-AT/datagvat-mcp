/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RDFXML } from '../models/RDFXML';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CataloguesService {
    /**
     * List catalogues
     * To retrieve the list of catalogues, send a GET request to the specified URL of the API with the resource path "catalogues". The query parameter "limit" specifies the number of resources to retrieve, while the query parameter "offset" determines the starting point for counting. Upon success, the response will contain, by default, an array with the URLs of the chosen number of catalogues (with 100 being the default limit). To retrieve identifiers (normalized IDs), metadata, or original IDs (IDs as by data provider) , you can choose a different value for the parameter "valueType".
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns string The list of resource(s)
     * @throws ApiError
     */
    public static listCatalogues(
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/catalogues',
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
     * Headers only for "List catalogues"
     * To retrieve only the headers for the list of catalogues, send a HEAD request to the specified URL of the API with the resource path "catalogues". The query parameter "limit" specifies the number of catalogues to retrieve, while the query parameter "offset" determines the starting point for counting. Upon success, the response will contain, by default, the headers for chosen number of catalogues' URLs (with 100 being the default limit). To retrieve the headers for the other data of catalogues select a different value for the parameter "valueType".
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns any Headers of list catalogues
     * @throws ApiError
     */
    public static headListCatalogues(
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/catalogues',
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad request`,
            },
        });
    }
    /**
     * Get catalogue
     * You can get a catalogue making a GET request to the specified URL of the API endpoint with the resource path "catalogues/{catalogueId}" set the unique ID of the catalogue as {catalogueId} element of the URL. If successful, the response contains the information about the specified catalogue.
     * @param catalogueId The catalogue id
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getCatalogue(
        catalogueId: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/catalogues/{catalogueId}',
            path: {
                'catalogueId': catalogueId,
            },
            errors: {
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * Headers only for "Get catalogue"
     * You can get only the headers for catalogue making a HEAD request to the specified URL of the API endpoint with the resource path "catalogues/{catalogueId}" set the unique ID of the catalogue as {catalogueId} element of the URL. If successful, the response contains the headers of the specified catalogue.
     * @param catalogueId The catalogue id
     * @returns any Headers of get catalogue
     * @throws ApiError
     */
    public static headGetCatalogue(
        catalogueId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/catalogues/{catalogueId}',
            path: {
                'catalogueId': catalogueId,
            },
            errors: {
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * Create or update catalogue
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can create or update the information of a specific catalog. Send a PUT request to the specified URL of the API endpoint, including the unique ID of the catalogue as {catalogueId} element of the URL and the updated information in the request. If the request is successful and the catalogueID already exists, the information in the catalogue will be updated with the newly provided information. If the catalogueID is new, a new catalogue will be created.
     * @param catalogueId The catalogue id
     * @param requestBody
     * @returns string Catalogue created
     * @throws ApiError
     */
    public static putCatalogue(
        catalogueId: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/catalogues/{catalogueId}',
            path: {
                'catalogueId': catalogueId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete catalogue
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can delete a specific catalogue. Send a DELETE request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}" at the end of URL, set the unique ID of the catalogue as {catalogueId} element of the URL. This operation deletes a catalogue's metadata, as well as the metadata of all referenced datasets, from the repository and the index. It also removes any related quality measurements if they exist. Caution: you cannot revert this operation
     * @param catalogueId The catalogue id
     * @returns void
     * @throws ApiError
     */
    public static deleteCatalogue(
        catalogueId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/catalogues/{catalogueId}',
            path: {
                'catalogueId': catalogueId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * List datasets of catalogue
     * To retrieve a list of datasets of a specific catalogue make a GET request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets" at the end of the URL, including the unique ID of the catalogue as {catalogueId} element of the URL. The query parameter "limit" specifies the number of datasets to retrieve, while the query parameter "offset" determines the starting point for counting. If the request is successful, by default, the response will contain an array with the URLs of the chosen number of datasets (with 100 being the default limit) from the specified catalogue. To retrieve other data of the datasets from the specified catalogue select a different value for the parameter "valueType".
     * @param catalogueId The catalogue id
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns string The list of resource(s)
     * @throws ApiError
     */
    public static listCatalogueDatasets(
        catalogueId: string,
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/catalogues/{catalogueId}/datasets',
            path: {
                'catalogueId': catalogueId,
            },
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * Headers only for "List datasets of catalogue"
     * To retrieve only the headers for the list of datasets from a specific catalogue, you can make a HEAD request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets" at the end of the URL, including the unique ID of the catalogue as {catalogueId} element of the URL. The query parameter "limit" specifies the number of datasets to retrieve, while the query parameter "offset" determines the starting point for counting. If the request is successful, by default, the response will contain the headers for chosen number of datasets' URLs (with 100 being the default limit) from the specified catalogue. To retrieve the headers for other data of the datasets from the specified catalogue select a different value for the parameter "valueType".
     * @param catalogueId The catalogue id
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns any Headers of list dataset of catalogue
     * @throws ApiError
     */
    public static headListCatalogueDatasets(
        catalogueId: string,
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/catalogues/{catalogueId}/datasets',
            path: {
                'catalogueId': catalogueId,
            },
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * Add dataset to catalogue
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to add a dataset. As an authorized user, you make a POST request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets" at the end of the URL and specify the unique ID of the catalogues as the {catalogueId} element of the URL.
     * @param catalogueId The catalogue id
     * @param requestBody
     * @returns string Dataset created
     * @throws ApiError
     */
    public static postCatalogueDataset(
        catalogueId: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/catalogues/{catalogueId}/datasets',
            path: {
                'catalogueId': catalogueId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * Get datasets of catalogue by means of an original id
     * To retrieve a specific dataset send a GET request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets/origin" at the end of the URL, set the unique ID of the catalogue as {catalogueId} element and the unique ID of the dataset as {origin} element of the URL.
     * @param catalogueId The catalogue id
     * @param originalId The original id of the dataset
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getCatalogueDatasetsOrigin(
        catalogueId: string,
        originalId: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/catalogues/{catalogueId}/datasets/origin',
            path: {
                'catalogueId': catalogueId,
            },
            query: {
                'originalId': originalId,
            },
            errors: {
                400: `Bad Request`,
                404: `Catalogue or Dataset Not Found`,
            },
        });
    }
    /**
     * Headers only for "Get dataset of a catalogue by means of an original id"
     * To retrieve the headers for a specific dataset send a HEAD request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets/origin" at the end of the URL, set the unique ID of the catalogue as {catalogueId} element and the unique ID of the dataset as {origin} element of the URL.
     * @param catalogueId The catalogue id
     * @param originalId The original id of the dataset
     * @returns any Headers of get dataset of catalogue by means of an original id
     * @throws ApiError
     */
    public static headGetCatalogueDatasetsOrigin(
        catalogueId: string,
        originalId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/catalogues/{catalogueId}/datasets/origin',
            path: {
                'catalogueId': catalogueId,
            },
            query: {
                'originalId': originalId,
            },
            errors: {
                400: `Bad Request`,
                404: `Catalogue or Dataset Not Found`,
            },
        });
    }
    /**
     * Create or update dataset of catalogue by means of an original id
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to create or update a dataset. As an authorized user, you make a PUT request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets/origin" at the end of the URL. Specify the unique ID of the catalogue, where the dataset is created, as the {catalogueId} and the unique ID of the dataset as the {origin} element of the URL accordingly. If the dataset with this ID already exists, it is updated.
     * @param catalogueId The catalogue id
     * @param originalId The original id of the dataset
     * @param requestBody
     * @returns string Dataset created
     * @throws ApiError
     */
    public static putCatalogueDatasetsOrigin(
        catalogueId: string,
        originalId: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/catalogues/{catalogueId}/datasets/origin',
            path: {
                'catalogueId': catalogueId,
            },
            query: {
                'originalId': originalId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                304: `Not modified, no update necessary`,
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Catalogue Not Found`,
            },
        });
    }
    /**
     * Delete dataset of catalogue by means of an original id
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can delete a dataset of a specific catalogue. Send a DELETE request to the specified URL of the API endpoint with the resource path "/catalogues/{catalogueId}/datasets/origin". Specify the unique ID of the catalogue as the {catalogueId} and the unique ID of the dataset as the {origin} element of the URL accordingly. This operation deletes the specified dataset, as well as all referenced distributions, from the repository and the index. It also removes any related quality measurements if they exist. Caution: you cannot revert this operation
     * @param catalogueId The catalogue id
     * @param originalId The original id of the dataset
     * @returns void
     * @throws ApiError
     */
    public static deleteCatalogueDatasetsOrigin(
        catalogueId: string,
        originalId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/catalogues/{catalogueId}/datasets/origin',
            path: {
                'catalogueId': catalogueId,
            },
            query: {
                'originalId': originalId,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Catalogue or Dataset Not Found`,
            },
        });
    }
}
