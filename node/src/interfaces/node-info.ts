export interface NodeInfo {
    about: string,
    origin: string,
    difficulty: number,
    comulativePoW: number,
    minerReward: string,
    blocks: number,
    lastBlockHash: string,
    transactions: {
        confirmed: number,
        pending: number
    },
    peers: number
}
