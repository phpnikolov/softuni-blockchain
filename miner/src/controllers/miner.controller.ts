import * as request from 'request';
import { setInterval } from "timers";
import { BlockchainService } from "../services/blockchain.service";
import { Transaction } from '../interfaces/transaction';
import { BigInteger } from "big-integer";
import * as bigInt from 'big-integer';
import { Block } from '../interfaces/block';

export class MinerController {
    private blockchainService: BlockchainService = new BlockchainService;
    private nodeUri: string;

    private prevBlockHash: string;
    private difficulty: number;
    private minerReward: string;
    private nextBlock: Block;

    private processedHashes = 0;

    public constructor(
        private nodeHostname: string,
        private miningAddress: string
    ) {
        this.nodeUri = `http://${this.nodeHostname}:5555`;
    }



    /** 
     * Тakes information from the Node to be able to mine the next block
    */
    private sync(): void {
        request({
            uri: this.nodeUri + '/info',
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                this.prevBlockHash = body.lastBlockHash;
                this.difficulty = Number(body.difficulty);
                this.minerReward = body.minerReward;
            }
            else {
                console.error('Can\'n get info from the Node!');
            }
        });

        request({
            uri: this.nodeUri + '/transactions/pending',
            json: true
        }, (error, response, pendingTxs: Transaction[]) => {
            if (!error && response.statusCode == 200) {
                let feeSum = bigInt(0);

                pendingTxs.forEach(tx => {
                    feeSum = feeSum.add(tx.fee);
                });

                // add miner reward transaction
                let trxReward: Transaction = {
                    to: this.miningAddress,
                    fee: this.blockchainService.softUni2Uni(0),
                    amount: feeSum.add(this.minerReward).toString(),
                    timeCreated: (new Date()).getTime()
                };

                trxReward.transactionHash = this.blockchainService.calculateTransactionHash(trxReward);

                pendingTxs.unshift(trxReward);

                this.nextBlock = {
                    prevBlockHash: this.prevBlockHash,
                    difficulty: this.difficulty,
                    transactions: pendingTxs,
                    timeCreated: (new Date()).getTime(),
                    nonce: 0
                }
            }
            else {
                console.error('Can\'n get pending transactions from the Node!');
            }
        });
    }


    private mine(): void {
        if (!this.nextBlock) {
            setTimeout(() => {
                this.mine();
            }, 100);
            return;
        }

        let blockHash = this.blockchainService.calculatekBlockHash(this.nextBlock);
        this.processedHashes++;
        let hashDifficulty: number = this.blockchainService.calculateHashDifficulty(blockHash);

        if (hashDifficulty >= this.difficulty) {
            console.log(`Block found!!! Nonce ${this.nextBlock.nonce}; Hash: ${blockHash}`);

            this.submitBlock(this.nextBlock);
            this.nextBlock = undefined;
        }
        else {
            this.nextBlock.nonce++;
            setTimeout(() => {
                this.mine();
            }, 0);
        }
    }


    private submitBlock(nextBlock: Block): void {
        request({
            method: 'POST',
            uri: this.nodeUri + '/blocks',
            json: nextBlock
        }, (error, response, body) => {
            if (!error && response.statusCode == 201) {
                console.log('Block is accepted.');
                this.sync();
            }
            else {
                console.error('Error: Block is rejected!', body);
            }

            this.sync();
            this.mine();
        });
    }

    public start(): void {
        // Sync with the Node every 1 sec
        this.sync();
        setInterval(() => {
            this.sync();
        }, 1000);

        // show miner stats every 5 sec
        let prevProcessedHashes: number = this.processedHashes;
        let prevTime: number = (new Date()).getTime();
        setInterval(() => {
            let timeNow = (new Date()).getTime();
            let pastTime = timeNow - prevTime;

            let hashPerSecond = Math.round((this.processedHashes - prevProcessedHashes) / (pastTime / 1000));

            console.log(`Total speed: ${hashPerSecond} hashes/sec`);
            prevTime = timeNow;
            prevProcessedHashes = this.processedHashes;
        }, 5000);

        this.mine();
    }


}