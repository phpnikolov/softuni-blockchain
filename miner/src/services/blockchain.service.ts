import * as CryptoJS from "crypto-js";
import * as _ from "lodash";
import { Transaction } from "../interfaces/transaction";
import { Block } from "../interfaces/block";

export class BlockchainService {

    public static calculatekBlockHash(prevBlockHash: string, transactions: Transaction[], nonce): string {
        // sort transaction by create timne
        let trxsSorted = _.sortBy(transactions, ['timeCreated']);
        let trxsHashes: string[] = [];
        
        transactions.forEach(trx => {
            let trxHash: string = BlockchainService.calculateTransactionHash(trx);
            trxsHashes.push(trxHash);
        });

        return CryptoJS.SHA256(JSON.stringify([
            prevBlockHash,
            trxsHashes,
            nonce
        ])).toString();
    }


    public static calculateTransactionHash(trx:Transaction): string {
        return CryptoJS.SHA256(JSON.stringify([trx.from, trx.to, trx.amount, trx.timeCreated])).toString();
    }


    /**
     * Calculate how many leading zeros `hash` have
     * @param hash 
     */
    public static calculateHashDifficulty(hash: string) {
        let difficulty = 0;
        for (let i = 0; i < hash.length; i++) {
            if (hash[i] == '0') {
                difficulty++;
            }
            else {
                break;
            }
        }
        return difficulty;
    }
}