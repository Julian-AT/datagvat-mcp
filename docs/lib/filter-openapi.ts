/** Minimal OpenAPI types for filtering; avoids openapi-types dependency. */
type Document = { paths?: Record<string, PathItem>;[k: string]: unknown };
type PathItem = {
	[key: string]: unknown;
	'x-internal'?: boolean;
	get?: Operation;
	put?: Operation;
	post?: Operation;
	delete?: Operation;
	patch?: Operation;
	options?: Operation;
	head?: Operation;
	trace?: Operation;
};
type Operation = {
	tags?: string[];
	operationId?: string;
	description?: string;
	'x-internal'?: boolean;
	[key: string]: unknown;
};

const HTTP_METHODS = [
	'get',
	'put',
	'post',
	'delete',
	'patch',
	'options',
	'head',
	'trace',
] as const;

export interface FilterOpenAPIOptions {
	xInternal?: boolean;
	internalTags?: string[];
	excludePathPrefixes?: string[];
	excludeOperationIds?: string[];
	excludeDescriptionContaining?: string;
}

const DEFAULT_OPTIONS: FilterOpenAPIOptions = {
	xInternal: true,
	internalTags: ['Internal'],
	excludePathPrefixes: [],
	excludeOperationIds: [],
};

function isInternalOperation(
	op: Operation | undefined,
	pathItem: PathItem,
	path: string,
	options: FilterOpenAPIOptions,
): boolean {
	if (!op) return false;

	if (options.xInternal !== false) {
		if (op['x-internal'] === true) return true;
		if (pathItem['x-internal'] === true) return true;
	}

	const internalTags = options.internalTags ?? [];
	if (
		internalTags.length > 0 &&
		op.tags?.some((t: string) => internalTags.includes(t))
	) {
		return true;
	}

	if (
		op.operationId &&
		(options.excludeOperationIds?.includes(op.operationId) ?? false)
	) {
		return true;
	}

	if (
		options.excludePathPrefixes?.some((prefix) => path.startsWith(prefix))
	) {
		return true;
	}

	if (options.excludeDescriptionContaining && op.description) {
		if (
			op.description
				.toLowerCase()
				.includes(options.excludeDescriptionContaining.toLowerCase())
		) {
			return true;
		}
	}

	return false;
}

export function filterOpenAPISchema(
	document: Document,
	options: FilterOpenAPIOptions = {},
): Document {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const paths = document.paths ?? {};
	const filteredPaths: Record<string, PathItem> = {};

	for (const [path, pathItem] of Object.entries(paths)) {
		if (!pathItem || typeof pathItem !== 'object') continue;
		if ('$ref' in pathItem && Object.keys(pathItem).length === 1) {
			continue;
		}

		const item = pathItem as PathItem;
		const filteredItem = { ...item };

		for (const method of HTTP_METHODS) {
			const op = (item as Record<string, unknown>)[method] as
				| Operation
				| undefined;
			if (!op) continue;
			if (isInternalOperation(op, item, path, opts)) {
				delete (filteredItem as Record<string, unknown>)[method];
			}
		}

		const hasMethod = HTTP_METHODS.some(
			(m) => (filteredItem as Record<string, unknown>)[m] != null,
		);
		if (hasMethod) {
			filteredPaths[path] = filteredItem;
		}
	}

	return {
		...document,
		paths: filteredPaths,
	};
}
