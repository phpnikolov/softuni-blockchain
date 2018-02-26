import { Transaction } from "./transaction";

export interface Block {
    blockHash?:string,
    prevBlockHash: string,
    difficulty?:number,
    transactions: Transaction[]
    timeCreated:number, 
    nonce: number,
}
