import { listCatalogues, ListCataloguesParams } from "./catalogues";
import { CatalogueRecord } from "../models/catalogue";
import {
    fetchAllPages,
    createPaginatedFetcher,
    FullFetchOptions,
    PaginatedResult,
    createPaginatedResult,
} from "../utils/pagination";

export async function listAllCatalogues(
    baseParams: Omit<ListCataloguesParams, "limit" | "offset"> = {},
    options?: FullFetchOptions
): Promise<CatalogueRecord[]> {

    const fetcher = createPaginatedFetcher(
        (params) => listCatalogues(params),
        baseParams
    );

    const results = await fetchAllPages(fetcher, options);
    return results;
}

export async function listCataloguesPaginated(
    params: ListCataloguesParams = {}
): Promise<PaginatedResult<CatalogueRecord>> {
    const { limit = 10, offset = 0, ...rest } = params;

    const items = await listCatalogues({ limit, offset, ...rest });

    return createPaginatedResult(items, limit, offset);
}

