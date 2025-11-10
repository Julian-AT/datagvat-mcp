export interface DistributionRecord {
    id: string;
    title?: string;
    accessURL?: string;
    downloadURL?: string;
    format?: string;
    mediaType?: string;
    byteSize?: number;
    license?: string;
    issued?: string;
    modified?: string;
}

export interface EnrichedDataset {
    id: string;
    title?: string;
    description?: string;
    keywords?: string[];
    modified?: string;
    issued?: string;
    publisher?: {
        name?: string;
        id?: string;
    };
    themes?: string[];
    spatial?: string[];
    license?: string;
    distributions: DistributionRecord[];
}

