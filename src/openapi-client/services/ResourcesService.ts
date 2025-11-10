/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResourcesService {
    /**
     * List resource types
     * You can get a list of resource types.
     * @returns string Request accepted.
     * @throws ApiError
     */
    public static listResourceTypes(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/resources',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * List resources
     * You can get a list of resources of an exact type with required parameter 'type'.
     * @param type Type to which the resources belong.
     * @returns string Request accepted.
     * @throws ApiError
     */
    public static listResources(
        type: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/resources/{type}',
            path: {
                'type': type,
            },
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Create a resource
     * You can post a resource with type.
     * @param type Type to which the resource belongs.
     * @param requestBody Model of the new Resource
     * @returns any Resource created.
     * @throws ApiError
     */
    public static postResource(
        type: string,
        requestBody: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/resources/{type}',
            path: {
                'type': type,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            errors: {
                400: `Invalid request.`,
                404: `Resource type not found.`,
            },
        });
    }
    /**
     * Create or Update a resource
     * You can put a resource with id and type.
     * @param id Id of the created or updated resource
     * @param type Type to which the resource belongs.
     * @param requestBody Model of the new Resource
     * @returns any Resource created.
     * @throws ApiError
     */
    public static putResource(
        id: string,
        type: string,
        requestBody: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/resources/{type}',
            path: {
                'type': type,
            },
            query: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/rdf+xml',
            errors: {
                400: `Invalid request.`,
                404: `Resource type not found.`,
            },
        });
    }
    /**
     * Get a resource
     * You can get a resource with id and type.
     * @param id Id of the resource
     * @param type Type to which the resource belongs.
     * @returns string Request accepted.
     * @throws ApiError
     */
    public static getResource(
        id: string,
        type: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/resources/{type}/{id}',
            path: {
                'id': id,
                'type': type,
            },
            errors: {
                400: `Invalid request.`,
                404: `Resource type or resource id not found.`,
            },
        });
    }
    /**
     * HEAD a resource
     * Get headers returned when requesting a resource
     * @param id Id of the resource
     * @param type Type to which the resource belongs.
     * @returns any Request accepted.
     * @throws ApiError
     */
    public static headGetResource(
        id: string,
        type: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/resources/{type}/{id}',
            path: {
                'id': id,
                'type': type,
            },
            errors: {
                400: `Invalid request.`,
                404: `Resource type or resource id not found.`,
            },
        });
    }
    /**
     * Delete a resource
     * You can delete a resource with id and type.
     * @param id Id of the resource
     * @param type Type to which the resource belongs.
     * @returns void
     * @throws ApiError
     */
    public static deleteResource(
        id: string,
        type: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/resources/{type}/{id}',
            path: {
                'id': id,
                'type': type,
            },
            errors: {
                400: `Invalid request.`,
                404: `Resource type or resource id not found.`,
            },
        });
    }
}
