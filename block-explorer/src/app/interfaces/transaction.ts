export interface Transaction {
    transactionHash?: string,
    from?: string,
    to: string,
    amount: string,
    fee: string,

    senderPubKey?: string,
    senderSignature?: string,
    timeCreated: number,


    blockHash?: string,
}
