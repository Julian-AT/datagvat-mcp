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

/** Media types supported by the docs generator (fumadocs-openapi and deps). */
const DEFAULT_SUPPORTED_MEDIA_TYPES = [
	'application/json',
	'application/xml',
	'text/xml',
	'text/plain',
	'text/html',
	'multipart/form-data',
	'application/x-www-form-urlencoded',
] as const;

export interface FilterOpenAPIOptions {
	xInternal?: boolean;
	internalTags?: string[];
	excludePathPrefixes?: string[];
	excludeOperationIds?: string[];
	excludeDescriptionContaining?: string;
	/** Media types to allow in requestBody.content and responses[].content. Unsupported types (e.g. RDF) are removed or replaced with a fallback. */
	allowedMediaTypes?: string[];
}

const DEFAULT_OPTIONS: FilterOpenAPIOptions = {
	xInternal: true,
	internalTags: ['Internal'],
	excludePathPrefixes: [],
	excludeOperationIds: [],
};

function normalizeContent(
	content: Record<string, unknown>,
	allowed: Set<string>,
): Record<string, unknown> {
	const filtered = Object.fromEntries(
		Object.entries(content).filter(([k]) => allowed.has(k)),
	);
	if (Object.keys(filtered).length > 0) return filtered;
	return {
		'application/json': {
			schema: {
				type: 'string',
				description: 'RDF or other format (see API description)',
			},
		},
	};
}

function normalizeOperationContent(
	op: Operation,
	allowed: Set<string>,
): Operation {
	let req = op.requestBody;
	if (req && typeof req === 'object' && !Array.isArray(req)) {
		const reqObj = req as Record<string, unknown>;
		if (
			reqObj.content &&
			typeof reqObj.content === 'object' &&
			!Array.isArray(reqObj.content)
		) {
			req = {
				...reqObj,
				content: normalizeContent(
					reqObj.content as Record<string, unknown>,
					allowed,
				),
			};
		}
	}
	let res = op.responses;
	if (res && typeof res === 'object' && !Array.isArray(res)) {
		const newRes: Record<string, unknown> = {};
		for (const [code, r] of Object.entries(res)) {
			if (r && typeof r === 'object' && !('$ref' in r)) {
				const rObj = r as Record<string, unknown>;
				if (
					rObj.content &&
					typeof rObj.content === 'object' &&
					!Array.isArray(rObj.content)
				) {
					newRes[code] = {
						...rObj,
						content: normalizeContent(
							rObj.content as Record<string, unknown>,
							allowed,
						),
					};
				} else {
					newRes[code] = r;
				}
			} else {
				newRes[code] = r;
			}
		}
		res = newRes;
	}
	return { ...op, requestBody: req, responses: res };
}

function normalizeComponents(
	document: Document,
	allowed: Set<string>,
): void {
	const comp = document.components as
		| { requestBodies?: unknown; responses?: unknown; parameters?: unknown }
		| undefined;
	if (!comp || typeof comp !== 'object' || Array.isArray(comp)) return;

	const reqBodies = comp.requestBodies;
	if (reqBodies && typeof reqBodies === 'object' && !Array.isArray(reqBodies)) {
		for (const v of Object.values(reqBodies)) {
			if (v && typeof v === 'object' && !('$ref' in v)) {
				const obj = v as Record<string, unknown>;
				if (
					obj.content &&
					typeof obj.content === 'object' &&
					!Array.isArray(obj.content)
				) {
					obj.content = normalizeContent(
						obj.content as Record<string, unknown>,
						allowed,
					);
				}
			}
		}
	}

	const responses = comp.responses;
	if (responses && typeof responses === 'object' && !Array.isArray(responses)) {
		for (const v of Object.values(responses)) {
			if (v && typeof v === 'object' && !('$ref' in v)) {
				const obj = v as Record<string, unknown>;
				if (
					obj.content &&
					typeof obj.content === 'object' &&
					!Array.isArray(obj.content)
				) {
					obj.content = normalizeContent(
						obj.content as Record<string, unknown>,
						allowed,
					);
				}
			}
		}
	}

	const parameters = comp.parameters;
	if (
		parameters &&
		typeof parameters === 'object' &&
		!Array.isArray(parameters)
	) {
		for (const v of Object.values(parameters)) {
			if (v && typeof v === 'object' && !('$ref' in v)) {
				const obj = v as Record<string, unknown>;
				if (
					obj.content &&
					typeof obj.content === 'object' &&
					!Array.isArray(obj.content)
				) {
					obj.content = normalizeContent(
						obj.content as Record<string, unknown>,
						allowed,
					);
				}
			}
		}
	}
}

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
	const allowedMedia = new Set(
		opts.allowedMediaTypes ?? [...DEFAULT_SUPPORTED_MEDIA_TYPES],
	);
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
			} else {
				(filteredItem as Record<string, unknown>)[method] =
					normalizeOperationContent(op, allowedMedia);
			}
		}

		const hasMethod = HTTP_METHODS.some(
			(m) => (filteredItem as Record<string, unknown>)[m] != null,
		);
		if (hasMethod) {
			filteredPaths[path] = filteredItem;
		}
	}

	normalizeComponents(document, allowedMedia);

	return {
		...document,
		paths: filteredPaths,
	};
}
