import * as CryptoJS from "crypto-js";
import * as _ from "lodash";
import { Transaction } from "../interfaces/transaction";

export class BlockchainService {

    public calculatekBlockHash(prevBlockHash: string, transactions: Transaction[], nonce): string {
        // sort transaction by create timne
        let trxsSorted = _.sortBy(transactions, ['timeCreated']);
        let trxsHashes: string[] = _.map(trxsSorted, 'transactionHash');;
        
        return CryptoJS.SHA256(JSON.stringify([
            prevBlockHash,
            trxsHashes,
            nonce
        ])).toString();
    }


    public calculateTransactionHash(trx:Transaction): string {
        return CryptoJS.SHA256(JSON.stringify([trx.from, trx.to, trx.amount, trx.timeCreated])).toString();
    }

    /**
     * Calculate how many leading zeros `hash` have
     * @param hash 
     */
    public calculateHashDifficulty(hash: string) {
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