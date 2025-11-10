/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RDFXML } from '../models/RDFXML';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatasetsService {
    /**
     * List datasets
     * Retrieve a list of datasets. This endpoint supports pagination using the "limit" and "offset" query parameters. The "valueType" query parameter can be used to specify the type of value to be returned for each dataset (e.g. normalized ID, metadata, or original ID). The "catalogue" and "sourceIds" query parameters are deprecated and will be removed in a future version.
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param catalogue Please, use `GET /catalogues/{catalogueId}/datasets` instead
     * @param sourceIds Please, use `valueType=originIds` instead
     * @param hydra Indicate that hydra paging should be used, only for valueType=metadata. If your service is behind a proxy, this might not work correctly. Find out more in the documentation:  https://doc.piveau.eu/admin-guide/hub-repo-admin-guide/
     * @param offset
     * @param limit
     * @param usePagedCollection Set to 'true' to use the legacy PagedCollection format for pagination. By default, the response will use the updated PartialCollectionView format. This parameter is provided for backward compatibility with clients that expect the old format.
     * @returns string The list of resource(s)
     * @throws ApiError
     */
    public static listDatasets(
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        catalogue?: string,
        sourceIds: boolean = false,
        hydra: boolean = false,
        offset?: number,
        limit: number = 100,
        usePagedCollection: boolean = false,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasets',
            query: {
                'valueType': valueType,
                'catalogue': catalogue,
                'sourceIds': sourceIds,
                'hydra': hydra,
                'offset': offset,
                'limit': limit,
                'usePagedCollection': usePagedCollection,
            },
            errors: {
                400: `Bad Request`,
                404: `Deprecated! See \`catalogue\` query parameter. Catalogue Not Found`,
            },
        });
    }
    /**
     * Headers only for "List datasets"
     * Retrieve only the headers for a list of datasets. This endpoint has the same query parameters and behavior as the GET method, but it only returns the headers of the response.
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param catalogue Please, use `GET /catalogues/{catalogueId}/datasets` instead
     * @param sourceIds Please, use `valueType=originIds` instead
     * @param hydra Indicate that hydra paging should be used, only for valueType=metadata. If your service is behind a proxy, this might not work correctly. Find out more in the documentation:  https://doc.piveau.eu/admin-guide/hub-repo-admin-guide/
     * @param offset
     * @param limit
     * @param usePagedCollection Set to 'true' to use the legacy PagedCollection format for pagination. By default, the response will use the updated PartialCollectionView format. This parameter is provided for backward compatibility with clients that expect the old format.
     * @returns any Headers of list datasets
     * @throws ApiError
     */
    public static headListDatasets(
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        catalogue?: string,
        sourceIds: boolean = false,
        hydra: boolean = false,
        offset?: number,
        limit: number = 100,
        usePagedCollection: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/datasets',
            query: {
                'valueType': valueType,
                'catalogue': catalogue,
                'sourceIds': sourceIds,
                'hydra': hydra,
                'offset': offset,
                'limit': limit,
                'usePagedCollection': usePagedCollection,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @deprecated
     * Add dataset
     * Deprecated. Please use `POST /catalogues/{catalogueId}/datasets/origin` instead.
     * @param catalogue The catalogue to add the dataset
     * @param requestBody
     * @returns string Dataset created
     * @throws ApiError
     */
    public static postCatalogueDatasetLegacy(
        catalogue: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/datasets',
            query: {
                'catalogue': catalogue,
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
     * @deprecated
     * Create or update dataset
     * Deprecated. Please use `PUT /catalogues/{catalogueId}/datasets/origin` instead
     * @param id The dataset id
     * @param catalogue The catalogue id
     * @param requestBody
     * @param data Generate data url
     * @returns string Dataset created
     * @throws ApiError
     */
    public static putDatasetLegacy(
        id: string,
        catalogue: string,
        requestBody: RDFXML,
        data: boolean = false,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/datasets',
            query: {
                'id': id,
                'catalogue': catalogue,
                'data': data,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                304: `Dataset not modified, no update necessary`,
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Forbidden`,
            },
        });
    }
    /**
     * @deprecated
     * Delete a dataset
     * Deprecated. Please use `DELETE /catalogues/{catalogueId}/datasets/origin` instead.
     * @param id The dataset id
     * @param catalogue The catalogue id
     * @returns void
     * @throws ApiError
     */
    public static deleteDatasetLegacy(
        id: string,
        catalogue: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/datasets',
            query: {
                'id': id,
                'catalogue': catalogue,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * Get dataset
     * To retrieve only the headers for a list of datasets, send a HEAD request to the specified API URL with the resource path "datasets". The query parameter "limit" specifies the number of resources to retrieve, while the query parameter "offset" determines the starting point for counting. Upon success, the response will contain, by default, the headers for the URLs of the chosen number of datasets (with 100 being the default limit). To retrieve identifiers (normalized IDs), metadata, or original IDs (IDs as by data provider) , you can choose a different value for the parameter "valueType".
     * @param datasetId The dataset id
     * @param catalogue Please, use `GET /catalogues/{catalogueId}/datasets/origin` instead
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getDataset(
        datasetId: string,
        catalogue?: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                400: `Bad Request`,
                404: `Catalogue or Dataset Not Found`,
            },
        });
    }
    /**
     * Headers only for "Get dataset"
     * You can get the headers for a specific dataset making a HEAD request to the specified API endpoint URL with the resource path "datasets/{datasetId}" at the end of the URL. Replace {datasetId} with the unique ID of the dataset as an element in the URL.
     * @param datasetId The dataset id
     * @param catalogue Please, use `HEAD /catalogues/{catalogueId}/datasets/origin` instead
     * @returns any Headers of get dataset
     * @throws ApiError
     */
    public static headGetDataset(
        datasetId: string,
        catalogue?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                400: `Bad request`,
                404: `Catalogue or Dataset Not Found`,
            },
        });
    }
    /**
     * Update a Dataset
     * Update a dataset. When you use an original dataset id for creation or update, please, use `PUT /catalogues/{catalogueId}/datasets/origin` instead.
     * @param datasetId The dataset id
     * @param requestBody
     * @param catalogue Please, use `PUT /catalogues/{catalogueId}/datasets/origin` instead
     * @returns any Deprecated! see `catalogue` query parameter
     * @throws ApiError
     */
    public static putDataset(
        datasetId: string,
        requestBody: RDFXML,
        catalogue?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            errors: {
                304: `Dataset not modified, no update necessary`,
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * Delete a dataset
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can delete a specific dataset. Send a DELETE request to the specified URL of the API endpoint with the resource path "datasets/{datasetId}". Set  the {datasetId} as the unique ID of the dataset you want to delete. This operation deletes the specified dataset, as well as all referenced distributions, from the repository and the index. It also removes any related quality measurements if they exist. Caution: you cannot revert this operation
     * @param datasetId The dataset id
     * @param catalogue Please, use `DELETE /catalogue/{catalogueId}/datasets/origin` instead
     * @returns void
     * @throws ApiError
     */
    public static deleteDataset(
        datasetId: string,
        catalogue?: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * List dataset distributions
     * To get a list of distributions of a particular dataset make a GET request to the specified URL of the API endpoint with the resource path "/datasets/{datasetId}/distributions" at the end of the URL, set the unique ID of the dataset as {datasetId} element of the URL. If successful, the response will contain, by default, an array with the URLs of all distributions. To retrieve the other data of the distributions from the specified dataset select a different value for the parameter "valueType".
     * @param datasetId The dataset id
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns string The list of resource(s)
     * @throws ApiError
     */
    public static listDatasetDistributions(
        datasetId: string,
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasets/{datasetId}/distributions',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * Headers only for "List dataset distributions"
     * To retrieve only the headers of the distributions' list from a specific dataset, make a HEAD request to the specified URL of the API endpoint with the resource path "/datasets/{datasetId}/distributions", including the unique ID of the dataset as {datasetId} element of the URL. The query parameter "limit" specifies the number of distributions to retrieve, while the query parameter "offset" determines the starting point for counting. If the request is successful, by default, the response will contain the headers for the list of URLs of all distributions from the specified dataset. To retrieve the headers for other data of the list of distributions from the specified dataset select a different value for the parameter "valueType".
     * @param datasetId The dataset id
     * @param valueType Return value type. In case of `urifRefs` and `identifiers` Accept header will be ignored and the return type will always be a JSON array
     * @param offset
     * @param limit
     * @returns any Headers of list dataset distributions
     * @throws ApiError
     */
    public static headListDatasetDistributions(
        datasetId: string,
        valueType: 'uriRefs' | 'identifiers' | 'originalIds' | 'metadata' = 'uriRefs',
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/datasets/{datasetId}/distributions',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'valueType': valueType,
                'offset': offset,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * Add distribution to dataset
     * This function is reserved for internal use only and is not part of our public API offerings. You must be authorized to insert a new distribution into a dataset. As an authorized user, you make a POST request to the specified URL of the API endpoint with the resource path "datasets/{datasetId}/distributions", setting the unique ID of the dataset as {datasetId} element of the URL, to add a new distribution of the specified dataset.
     * @param datasetId The dataset id
     * @param requestBody
     * @returns string Distribution created
     * @throws ApiError
     */
    public static postDatasetDistribution(
        datasetId: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/datasets/{datasetId}/distributions',
            path: {
                'datasetId': datasetId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * Get dataset metrics
     * To retrieve the metrics of metadata quality and their corresponding values for a specified dataset, send a GET request to the designated API endpoint URL with the resource path "/datasets/{datasetId}/metrics" added at the end of the URL, set the unique ID of the dataset as {datasetId} element of the URL. By default the latest measurements will be provide. To obtain a graph with all data collected for the specified dataset, set the query parameter "historic" to "true".
     * @param datasetId The dataset id
     * @param historic Whether the historic metrics graph should be returned. Ignored when historic graphs are disabled in config.
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getMetrics(
        datasetId: string,
        historic: boolean = false,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasets/{datasetId}/metrics',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'historic': historic,
            },
            errors: {
                400: `Bad Request`,
                404: `Dataset Not Found`,
            },
        });
    }
    /**
     * Headers only for "Get dataset metrics"
     * To retrieve the headers for the metrics of metadata quality and their corresponding values for a specified dataset, send a HEAD request to the specified API endpoint URL with the resource path "/datasets/{datasetId}/metrics" added at the end of the URL, set the unique ID of the dataset as {datasetId} element of the URL. By default the headers for metadata of the latest measurements will be provide. To get headers for a graph with the metadata of all data, collected for the specified dataset, set the query parameter "historic" to "true".
     * @param datasetId The dataset id
     * @param historic Whether the historic metrics graph should be returned. Ignored when historic graphs are disabled in config.
     * @returns any Dataset metrics info
     * @throws ApiError
     */
    public static headGetMetrics(
        datasetId: string,
        historic: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/datasets/{datasetId}/metrics',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'historic': historic,
            },
            errors: {
                400: `Bad Request`,
                404: `Dataset not found`,
            },
        });
    }
    /**
     * Create/Update metrics for a dataset
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can createor update metrics for a dataset, by making a PUT request to the specified  API endpoint URL with the resource path "/datasets/{datasetId}/metrics" added at the end of the URL. Specify the unique ID of the dataset as the {datasetId}.
     * @param datasetId The dataset id
     * @param requestBody
     * @returns string Dataset metrics created
     * @throws ApiError
     */
    public static putMetrics(
        datasetId: string,
        requestBody: RDFXML,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/datasets/{datasetId}/metrics',
            path: {
                'datasetId': datasetId,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            responseHeader: 'Location',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset not found`,
            },
        });
    }
    /**
     * Delete metrics
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user you can create or update metrics for a dataset, making a DELETE request to the specified API endpoint URL with the resource path "/datasets/{datasetId}/metrics" added at the end of the URL. Specify the unique ID of the dataset as the {datasetId}.
     * @param datasetId The dataset id
     * @returns void
     * @throws ApiError
     */
    public static deleteMetrics(
        datasetId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/datasets/{datasetId}/metrics',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset not found`,
            },
        });
    }
    /**
     * Get catalogue record
     * To retrieve the catalogue record of a specific dataset, make a GET request to the specified URL of the API endpoint with the resource path "/datasets/{datasetId}/record" at the end of the URL, set the unique ID of the dataset as {datasetId} element of the URL.
     * @param datasetId The dataset id
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getRecord(
        datasetId: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasets/{datasetId}/record',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                404: `Dataset not found`,
            },
        });
    }
    /**
     * Headers only for "Get catalogue record"
     * To retrieve only the headers for a catalogue record of a specific dataset make a HEAD request to the specified API endpoint URL with the resource path "/datasets/{datasetId}/record" added at the end of the URL, set the unique ID of the dataset as {datasetId} element of the URL.
     * @param datasetId The dataset id
     * @returns any Headers of get catalogue record
     * @throws ApiError
     */
    public static headGetRecord(
        datasetId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/datasets/{datasetId}/record',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                404: `Dataset not found`,
            },
        });
    }
    /**
     * @deprecated
     * Get catalogue record
     * @param datasetId The dataset id
     * @param catalogue
     * @returns RDFXML The resource graph(s)
     * @throws ApiError
     */
    public static getRecordLegacy(
        datasetId: string,
        catalogue?: string,
    ): CancelablePromise<RDFXML> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/records/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                404: `Dataset not found`,
            },
        });
    }
    /**
     * @deprecated
     * Headers only for "Get catalogue record"
     * @param datasetId The dataset id
     * @param catalogue
     * @returns any Headers of get catalogue record
     * @throws ApiError
     */
    public static headGetRecordLegacy(
        datasetId: string,
        catalogue?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/records/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'catalogue': catalogue,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Index/Reindex a dataset
     * This function is reserved for internal use only and is not part of our public API offerings. As an authorized user, you can add a specified dataset to the distributed document store (hub-search) and receive an index of the stored dataset in the response.
     * @param datasetId The dataset id
     * @returns any Dataset index. Dataset is re-indexed.
     * @throws ApiError
     */
    public static getDatasetIndex(
        datasetId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasets/{datasetId}/index',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Dataset not found`,
            },
        });
    }
}
