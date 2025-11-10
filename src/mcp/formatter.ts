type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue }
interface JSONArray extends Array<JSONValue> {}

export function formatForLLM(data: JSONValue): JSONValue {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(formatForLLM);
  }

  if (typeof data !== "object") {
    return data;
  }

  const formatted: JSONObject = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    if (typeof value === "object" && value !== null && Object.keys(value).length === 0) {
      continue;
    }

    const formattedKey = key.startsWith("http://") || key.startsWith("https://")
      ? key.split("/").pop() || key
      : key;

    formatted[formattedKey] = formatForLLM(value);
  }

  return formatted;
}

interface Distribution {
  id?: string;
  title?: string;
  downloadURL?: string;
  accessURL?: string;
  format?: string;
  byteSize?: number;
  license?: string;
}

export function flattenDistribution(dist: Distribution): Partial<Distribution> {
  return {
    id: dist.id,
    title: dist.title,
    downloadURL: dist.downloadURL || dist.accessURL,
    format: dist.format,
    byteSize: dist.byteSize,
    license: dist.license?.split("/").pop() || dist.license,
  };
}

interface Dataset {
  id?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  publisher?: { name?: string; id?: string };
  modified?: string;
  distributions?: unknown[];
}

export function summarizeDataset(dataset: Dataset): Record<string, unknown> {
  const publisherValue = dataset.publisher?.name || dataset.publisher?.id;
  return {
    id: dataset.id,
    title: dataset.title,
    description: dataset.description
      ? dataset.description.substring(0, 200) + (dataset.description.length > 200 ? "..." : "")
      : undefined,
    keywords: dataset.keywords,
    publisher: publisherValue,
    modified: dataset.modified,
    distributionCount: Array.isArray(dataset.distributions)
      ? dataset.distributions.length
      : undefined,
  };
}

export function enrichWithContext<T>(data: T, context: Record<string, unknown> & {
  source?: string;
  timestamp?: string;
}): { data: T; context: Record<string, unknown> } {
  return {
    data,
    context: {
      source: context.source || "data.gv.at",
      timestamp: context.timestamp || new Date().toISOString(),
      ...context,
    },
  };
}

export function extractKeyInfo(dataset: Dataset): string {
  const parts: string[] = [];

  if (dataset.title) {
    parts.push(`Title: ${dataset.title}`);
  }

  if (dataset.description) {
    const desc = dataset.description.substring(0, 150);
    parts.push(`Description: ${desc}${dataset.description.length > 150 ? "..." : ""}`);
  }

  if (dataset.keywords && dataset.keywords.length > 0) {
    parts.push(`Keywords: ${dataset.keywords.join(", ")}`);
  }

  if (dataset.publisher?.name) {
    parts.push(`Publisher: ${dataset.publisher.name}`);
  }

  if (dataset.distributions && dataset.distributions.length > 0) {
    const formats = dataset.distributions
      .map((d: unknown) => (d as { format?: string }).format)
      .filter(Boolean)
      .join(", ");
    if (formats) {
      parts.push(`Available formats: ${formats}`);
    }
  }

  return parts.join(" | ");
}

