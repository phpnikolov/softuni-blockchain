import * as CryptoJS from "crypto-js";
import * as _ from "lodash";
import { Transaction } from "../interfaces/transaction";
import { BigInteger } from "big-integer";
import * as bigInt from 'big-integer';

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

    public calculateBalance(address:string, confirmedTxs:Transaction[], pendingTxs:Transaction[]):BigInteger {
        let balance: BigInteger = bigInt(0);

        for (let i = 0; i < confirmedTxs.length; i++) {
            const trx = confirmedTxs[i];

            if (trx.to == address) {
                // incoming transaction, add amount to balance 
                balance.add(trx.amount);
            }
            else if (trx.from == address) {
                // outgoing transaction, subtract amount from balance
                balance.minus(trx.amount);
            }
        }

        for (let i = 0; i < pendingTxs.length; i++) {
            const trx = pendingTxs[i];

            if (trx.from == address) {
                // penging outgoing transaction, subtract amount from balance
                balance.minus(trx.amount);
            }
        }

        return balance;
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


    public util = {
        units: {
            softuni: 18, // SoftUni - the smallest unit (10^18)
            muni: 10, // mUni - the smallest unit (10^10)
            uni: 0 // Uni - the smallest unit (10^0)
        },
        fromUni: (value:number|BigInteger, power:number):BigInteger => {
            if (typeof value === 'number') {
                value = bigInt(value);
            }

            return value.divide(Math.pow(10,power));
        },

        toUni: (value:number|BigInteger, power:number) => {
            if (typeof value === 'number') {
                value = bigInt(value);
            }

            return value.multiply(Math.pow(10,power));
        }
    }
}