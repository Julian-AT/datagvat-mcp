export interface DatasetRecord {
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
}

export interface DatasetMetadata extends DatasetRecord {
    distributions?: string[];
    themes?: string[];
    spatial?: string[];
    temporal?: {
        startDate?: string;
        endDate?: string;
    };
    contactPoint?: {
        name?: string;
        email?: string;
    };
    license?: string;
    accessRights?: string;
}

