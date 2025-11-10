import { listDatasets, ListDatasetsParams } from "./datasets";
import { DatasetRecord } from "../models/dataset";
import {
  fetchAllPages,
  createPaginatedFetcher,
  FullFetchOptions,
  PaginatedResult,
  createPaginatedResult,
} from "../utils/pagination";

export async function listAllDatasets(
  catalogueId: string,
  baseParams: Omit<ListDatasetsParams, "limit" | "offset"> = {},
  options?: FullFetchOptions
): Promise<DatasetRecord[]> {

  const fetcher = createPaginatedFetcher(
    (params) => listDatasets(catalogueId, params),
    baseParams
  );

  const results = await fetchAllPages(fetcher, options);
  return results;
}

export async function listDatasetsPaginated(
  catalogueId: string,
  params: ListDatasetsParams = {}
): Promise<PaginatedResult<DatasetRecord>> {
  const { limit = 10, offset = 0, ...rest } = params;

  const items = await listDatasets(catalogueId, { limit, offset, ...rest });

  return createPaginatedResult(items, limit, offset);
}

