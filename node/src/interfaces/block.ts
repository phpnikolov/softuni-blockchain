import { Transaction } from "./transaction";

export interface Block {
    index:number,
    blockHash?:string,
    prevBlockHash: string,
    difficulty:number,
    transactions: Transaction[]
    timeCreated:number, 
    nonce: number,
}
