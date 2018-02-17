export interface Transaction {
    transactionHash?: string,
    from?: string,
    to: string,
    amount: string,

    senderPubKey?: string,
    senderSignature?: string,
    timeCreated: number,


    blockHash?: string,
}
