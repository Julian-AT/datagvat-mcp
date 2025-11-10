import axios, { AxiosError } from "axios";
import { z } from "zod";

export interface VocabularyRecord {
    id: string;
    title?: string;
    description?: string;
}

const HydraMemberSchema = z.object({
    "@id": z.string(),
    "@type": z.string().optional(),
    "http://purl.org/dc/terms/title": z
        .array(
            z.object({
                "@value": z.string(),
                "@language": z.string().optional(),
            })
        )
        .optional(),
    "http://purl.org/dc/terms/description": z
        .array(
            z.object({
                "@value": z.string(),
                "@language": z.string().optional(),
            })
        )
        .optional(),
});

const VocabularyResponseSchema = z.object({
    "@context": z.any().optional(),
    "@graph": z
        .array(
            z.object({
                "@id": z.string().optional(),
                "@type": z.union([z.string(), z.array(z.string())]).optional(),
                "http://www.w3.org/ns/hydra/core#member": z
                    .array(HydraMemberSchema)
                    .optional(),
            })
        )
        .optional(),
    "http://www.w3.org/ns/hydra/core#member": z
        .array(HydraMemberSchema)
        .optional(),
});

export interface ListVocabulariesParams {
    valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
    limit?: number;
    offset?: number;
}

export async function listVocabularies(
    params: ListVocabulariesParams = {}
): Promise<VocabularyRecord[]> {
    const { valueType = "identifiers", limit = 100, offset = 0 } = params;

    const baseUrl =
        process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
    const url = `${baseUrl}/vocabularies`;

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
            const validatedData = VocabularyResponseSchema.parse(response.data);

            let members: z.infer<typeof HydraMemberSchema>[] = [];

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

            return members.map((vocab) => ({
                id: vocab["@id"],
                title: vocab["http://purl.org/dc/terms/title"]?.[0]?.["@value"],
                description:
                    vocab["http://purl.org/dc/terms/description"]?.[0]?.["@value"],
            }));
        }

        return [];
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Vocabulary response validation failed: ${error.message}`);
        }

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            throw new Error(
                `Vocabulary fetching failed: ${axiosError.message} (status: ${axiosError.response?.status})`
            );
        }
        throw new Error(`Vocabulary fetching failed: ${error}`);
    }
}

export async function getVocabulary(
    vocabularyId: string
): Promise<VocabularyRecord | null> {
    const baseUrl =
        process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
    const url = `${baseUrl}/vocabularies/${vocabularyId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Accept: "application/ld+json",
            },
        });

        const validatedData = VocabularyResponseSchema.parse(response.data);

        let vocabData: z.infer<typeof HydraMemberSchema> | undefined;

        if (validatedData["@graph"]) {
            vocabData = validatedData["@graph"].find(
                (item) => item["@id"] && item["@id"].includes(vocabularyId)
            ) as z.infer<typeof HydraMemberSchema> | undefined;
        }

        if (!vocabData) {
            return null;
        }

        return {
            id: vocabData["@id"],
            title: vocabData["http://purl.org/dc/terms/title"]?.[0]?.["@value"],
            description:
                vocabData["http://purl.org/dc/terms/description"]?.[0]?.["@value"],
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 404) {
                return null;
            }
            throw new Error(
                `Vocabulary fetching failed: ${axiosError.message} (status: ${axiosError.response?.status})`
            );
        }
        throw new Error(`Vocabulary fetching failed: ${error}`);
    }
}

