/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActionApiService {
    /**
     * Call an Action
     * Post a JSON-RPC request to make a call to an action
     *
     * @param requestBody The action in JSON-RPC format
     * @returns any JSON-RPC Response
     * @throws ApiError
     */
    public static postAction(
        requestBody: Record<string, any>,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/action',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
