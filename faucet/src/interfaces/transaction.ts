export interface Transaction {
    transactionHash?:string,
    from?:string,
    to:string,
    amount:number,

    senderPubKey?: string,
    senderSignature?: string,
    timeCreated:number,


    blockHash?:string,
}
