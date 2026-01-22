export interface LatticeManifest {
    version: 1,
    name: string,
    size: number,
    chunkSize: number,
    fileHash: string,
    chunks: string[],
    tracker: {
        host: string,
        port: number
    }
}

export interface DownloadState {
    fileHash: string;
    chunkSize: number;
    totalChunks: number;
    completed: number[];
}
