import * as CryptoJS from "crypto-js";
import * as _ from "lodash";
import { Transaction } from "../interfaces/transaction";
import { BigInteger } from "big-integer";
import * as bigInt from 'big-integer';

export class BlockchainService {

    public calculatekBlockHash(prevBlockHash: string, transactions: Transaction[], nonce): string {
        // sort transaction by create timne
        let trxsSorted = _.sortBy(transactions, ['timeCreated']);
        let trxsHashes: string[] = _.map(trxsSorted, 'transactionHash');

        return CryptoJS.SHA256(JSON.stringify([prevBlockHash, trxsHashes, nonce])).toString();
    }


    public calculateTransactionHash(trx: Transaction): string {
        return CryptoJS.SHA256(JSON.stringify([trx.from, trx.to, trx.amount, trx.timeCreated])).toString();
    }

    public calculateBalance(address: string, confirmedTxs: Transaction[], pendingTxs: Transaction[]): BigInteger {
        let balance: BigInteger = bigInt(0);

        for (let i = 0; i < confirmedTxs.length; i++) {
            const trx = confirmedTxs[i];

            if (trx.to == address) {
                // incoming transaction, add amount to balance 
                balance = balance.add(trx.amount);
            }
            else if (trx.from == address) {
                // outgoing transaction, subtract amount from balance
                balance = balance.minus(trx.amount);
            }
        }

        for (let i = 0; i < pendingTxs.length; i++) {
            const trx = pendingTxs[i];

            if (trx.from == address) {
                // penging outgoing transaction, subtract amount from balance
                balance = balance.minus(trx.amount);
            }
        }

        return balance;
    }

    /**
     * Calculate how many leading zeros `hash` have
     * @param hash 
     */
    public calculateHashDifficulty(hash: string):number {
        for (let i = 0; i < hash.length; i++) {
            if (hash[i] !== '0') return i; 
        }
    }

    // Uni - the smallest unit
    // SoftUni - the smallest unit (10^18 uni)
    public uni2SoftUni(value: string | BigInteger, power: number): number {
        let intPart:string = value.toString().slice(0,-18);
        let decPart:string = _.padStart(value.toString().slice(-18), 18, '0');

        return parseFloat(intPart + '.' + decPart);
    }

    public softUni2Uni(value: number): string {
        let intPart = Math.floor(value);
        let decPart = _.padEnd((value + '').split('.')[1], 18, '0');

        return _.trimStart(intPart + decPart, '0');
    }
}