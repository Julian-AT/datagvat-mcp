import axios, { AxiosError } from "axios";
import { z } from "zod";
import {
    DistributionRecord,
    EnrichedDataset,
} from "../models/distribution";
import { getDataset } from "./datasets";

const HydraDistributionSchema = z.object({
    "@id": z.string(),
    "@type": z.union([z.string(), z.array(z.string())]).optional(),
    "http://purl.org/dc/terms/title": z
        .array(
            z.object({
                "@value": z.string(),
                "@language": z.string().optional(),
            })
        )
        .optional(),
    "http://www.w3.org/ns/dcat#accessURL": z
        .array(
            z.object({
                "@id": z.string(),
            })
        )
        .optional(),
    "http://www.w3.org/ns/dcat#downloadURL": z
        .array(
            z.object({
                "@id": z.string(),
            })
        )
        .optional(),
    "http://purl.org/dc/terms/format": z
        .array(
            z.object({
                "@value": z.string().optional(),
                "@id": z.string().optional(),
            })
        )
        .optional(),
    "http://www.w3.org/ns/dcat#mediaType": z
        .array(
            z.object({
                "@value": z.string(),
            })
        )
        .optional(),
    "http://www.w3.org/ns/dcat#byteSize": z
        .array(
            z.object({
                "@value": z.string(),
                "@type": z.string().optional(),
            })
        )
        .optional(),
    "http://purl.org/dc/terms/license": z
        .array(
            z.object({
                "@id": z.string(),
            })
        )
        .optional(),
    "http://purl.org/dc/terms/issued": z
        .array(
            z.object({
                "@value": z.string(),
                "@type": z.string().optional(),
            })
        )
        .optional(),
    "http://purl.org/dc/terms/modified": z
        .array(
            z.object({
                "@value": z.string(),
                "@type": z.string().optional(),
            })
        )
        .optional(),
});

const DistributionResponseSchema = z.object({
    "@context": z.any().optional(),
    "@graph": z
        .array(
            z.object({
                "@id": z.string().optional(),
                "@type": z.union([z.string(), z.array(z.string())]).optional(),
                "http://www.w3.org/ns/hydra/core#member": z
                    .array(HydraDistributionSchema)
                    .optional(),
            })
        )
        .optional(),
    "http://www.w3.org/ns/hydra/core#member": z
        .array(HydraDistributionSchema)
        .optional(),
});

const DistributionDetailSchema = z.object({
    "@context": z.any().optional(),
    "@graph": z.array(z.any()).optional(),
    "@id": z.string().optional(),
    "@type": z.union([z.string(), z.array(z.string())]).optional(),
});

export interface ListDistributionsParams {
    valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
    limit?: number;
    offset?: number;
}

export async function listDistributions(
    datasetId: string,
    params: ListDistributionsParams = {}
): Promise<DistributionRecord[]> {
    const { valueType = "identifiers", limit = 100, offset = 0 } = params;

    const baseUrl =
        process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
    const url = `${baseUrl}/datasets/${datasetId}/distributions`;

    try {
        const response = await axios.get(url, {
            params: { valueType, limit, offset },
            headers: {
                Accept: "application/ld+json",
            },
        });

        if (valueType === "identifiers" || valueType === "uriRefs" || valueType === "originalIds") {
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        }

        if (typeof response.data === 'string') {
            return [];
        }

        if (valueType === "metadata") {
            const validatedData = DistributionResponseSchema.parse(response.data);

            let members: z.infer<typeof HydraDistributionSchema>[] = [];

            if (validatedData["http://www.w3.org/ns/hydra/core#member"]) {
                members = validatedData["http://www.w3.org/ns/hydra/core#member"];
            } else if (validatedData["@graph"]) {
                for (const item of validatedData["@graph"]) {
                    if (item["http://www.w3.org/ns/hydra/core#member"]) {
                        members = item["http://www.w3.org/ns/hydra/core#member"];
                        break;
                    }
                }
            }

            return members.map((dist) => ({
                id: dist["@id"],
                title: dist["http://purl.org/dc/terms/title"]?.[0]?.["@value"],
                accessURL:
                    dist["http://www.w3.org/ns/dcat#accessURL"]?.[0]?.["@id"],
                downloadURL:
                    dist["http://www.w3.org/ns/dcat#downloadURL"]?.[0]?.["@id"],
                format:
                    dist["http://purl.org/dc/terms/format"]?.[0]?.["@value"] ||
                    dist["http://purl.org/dc/terms/format"]?.[0]?.["@id"],
                mediaType:
                    dist["http://www.w3.org/ns/dcat#mediaType"]?.[0]?.["@value"],
                byteSize: dist["http://www.w3.org/ns/dcat#byteSize"]?.[0]?.["@value"]
                    ? parseInt(
                        dist["http://www.w3.org/ns/dcat#byteSize"][0]["@value"],
                        10
                    )
                    : undefined,
                license: dist["http://purl.org/dc/terms/license"]?.[0]?.["@id"],
                issued: dist["http://purl.org/dc/terms/issued"]?.[0]?.["@value"],
                modified: dist["http://purl.org/dc/terms/modified"]?.[0]?.["@value"],
            }));
        }

        return [];
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Distribution response validation failed: ${error.message}`
            );
        }

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            throw new Error(
                `Distribution fetching failed: ${axiosError.message} (status: ${axiosError.response?.status})`
            );
        }
        throw new Error(`Distribution fetching failed: ${error}`);
    }
}

export async function getDistribution(
    distributionId: string
): Promise<DistributionRecord | null> {
    const baseUrl =
        process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
    const url = `${baseUrl}/distributions/${distributionId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Accept: "application/ld+json",
            },
        });

        const validatedData = DistributionDetailSchema.parse(response.data);

        let distNode: any = null;

        if (validatedData["@graph"] && Array.isArray(validatedData["@graph"])) {
            distNode = validatedData["@graph"].find(
                (node: any) =>
                    node["@type"] &&
                    (node["@type"] === "http://www.w3.org/ns/dcat#Distribution" ||
                        (Array.isArray(node["@type"]) &&
                            node["@type"].includes(
                                "http://www.w3.org/ns/dcat#Distribution"
                            )))
            );
        } else {
            distNode = response.data;
        }

        if (!distNode) {
            return null;
        }

        const distribution: DistributionRecord = {
            id: distNode["@id"] || distributionId,
            title:
                distNode["http://purl.org/dc/terms/title"]?.[0]?.["@value"] ||
                distNode["title"],
            accessURL:
                distNode["http://www.w3.org/ns/dcat#accessURL"]?.[0]?.["@id"],
            downloadURL:
                distNode["http://www.w3.org/ns/dcat#downloadURL"]?.[0]?.["@id"],
            format:
                distNode["http://purl.org/dc/terms/format"]?.[0]?.["@value"] ||
                distNode["http://purl.org/dc/terms/format"]?.[0]?.["@id"],
            mediaType:
                distNode["http://www.w3.org/ns/dcat#mediaType"]?.[0]?.["@value"],
            byteSize: distNode["http://www.w3.org/ns/dcat#byteSize"]?.[0]?.["@value"]
                ? parseInt(
                    distNode["http://www.w3.org/ns/dcat#byteSize"][0]["@value"],
                    10
                )
                : undefined,
            license: distNode["http://purl.org/dc/terms/license"]?.[0]?.["@id"],
            issued: distNode["http://purl.org/dc/terms/issued"]?.[0]?.["@value"],
            modified: distNode["http://purl.org/dc/terms/modified"]?.[0]?.["@value"],
        };
        return distribution;
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Distribution metadata validation failed: ${error.message}`
            );
        }

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 404) {
                return null;
            }
            throw new Error(
                `Distribution metadata fetch failed: ${axiosError.message} (status: ${axiosError.response?.status})`
            );
        }
        throw new Error(`Distribution metadata fetch failed: ${error}`);
    }
}

export async function getEnrichedDataset(
    datasetId: string
): Promise<EnrichedDataset | null> {

    try {
        const datasetMetadata = await getDataset(datasetId);
        if (!datasetMetadata) {
            return null;
        }

        const distributions = await listDistributions(datasetId, {
            valueType: "metadata",
        });

        const enriched: EnrichedDataset = {
            id: datasetMetadata.id,
            title: datasetMetadata.title,
            description: datasetMetadata.description,
            keywords: datasetMetadata.keywords,
            modified: datasetMetadata.modified,
            issued: datasetMetadata.issued,
            publisher: datasetMetadata.publisher,
            themes: datasetMetadata.themes,
            spatial: datasetMetadata.spatial,
            license: datasetMetadata.license,
            distributions,
        };

        return enriched;
    } catch (error) {
        throw error;
    }
}

