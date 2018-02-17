import { BigInteger } from 'big-integer';

export interface Transaction {
    transactionHash?: string,
    from?: string,
    to: string,
    amount: BigInteger,

    senderPubKey?: string,
    senderSignature?: string,
    timeCreated: number,


    blockHash?: string,
}
