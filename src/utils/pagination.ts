export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedFetcher<T> {
  (params: PaginationParams): Promise<T[]>;
}

export interface FullFetchOptions {
  maxItems?: number;
  maxRequests?: number;
  batchSize?: number;
  delayMs?: number;
}

const DEFAULT_OPTIONS: Required<FullFetchOptions> = {
  maxItems: 5000,
  maxRequests: 50,
  batchSize: 100,
  delayMs: 100,
};

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAllPages<T>(
  fetcher: PaginatedFetcher<T>,
  options: FullFetchOptions = {}
): Promise<T[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: T[] = [];
  let offset = 0;
  let requestCount = 0;

  while (true) {
    if (requestCount >= opts.maxRequests) {
      break;
    }

    if (results.length >= opts.maxItems) {
      break;
    }

    const remainingItems = opts.maxItems - results.length;
    const currentBatchSize = Math.min(opts.batchSize, remainingItems);

    const batch = await fetcher({
      limit: currentBatchSize,
      offset,
    });

    if (batch.length === 0) {
      break;
    }

    results.push(...batch);
    offset += batch.length;
    requestCount++;

    if (batch.length < currentBatchSize) {
      break;
    }

    if (opts.delayMs > 0 && requestCount < opts.maxRequests) {
      await delay(opts.delayMs);
    }
  }

  return results;
}

export function createPaginatedFetcher<T>(
  baseFetcher: (params: Record<string, unknown>) => Promise<T[]>,
  baseParams: Record<string, unknown> = {}
): PaginatedFetcher<T> {
  return async (paginationParams: PaginationParams) => {
    return baseFetcher({ ...baseParams, ...paginationParams });
  };
}

export interface PaginationMetadata {
  total?: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export function createPaginatedResult<T>(
  items: T[],
  limit: number,
  offset: number,
  total?: number
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      total,
      limit,
      offset,
      hasMore: items.length === limit,
    },
  };
}

