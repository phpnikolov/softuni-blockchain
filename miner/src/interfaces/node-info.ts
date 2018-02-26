export interface NodeInfo {
    about: string,
    nodeUrl: string,
    difficulty: number,
    cumulativeDifficulty: number,
    blockReward: string,
    blocksCount: number,
    lastBlockHash: string,
    transactions: {
        confirmedCount: number,
        pendingCount: number
    },
    peersCount: number
}
