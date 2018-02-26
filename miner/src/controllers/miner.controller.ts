import * as request from 'request';
import { setInterval } from "timers";
import { BlockchainService } from "../services/blockchain.service";
import { Transaction } from '../interfaces/transaction';
import { BigInteger } from "big-integer";
import * as bigInt from 'big-integer';
import { Block } from '../interfaces/block';
import { NodeInfo } from '../interfaces/node-info';

export class MinerController {
    private blockchainService: BlockchainService = new BlockchainService;
    private nodeUrl: string;

    private pendingTxs: Transaction[] = [];
    private nextBlock: Block;

    private processedHashes = 0;

    public constructor(
        private nodeHostname: string,
        private miningAddress: string
    ) {
        this.nodeUrl = `http://${this.nodeHostname}:5555`;
    }


    /** 
     * Тakes information from the Node to be able to mine the next block
    */
    private sync(): void {
        request({
            uri: this.nodeUrl + '/info',
            json: true
        }, (error, response, nodeInfo: NodeInfo) => {
            if (!error && response.statusCode == 200) {

                let txsFees = bigInt(0);

                this.pendingTxs.forEach(tx => {
                    txsFees = txsFees.add(tx.fee);
                });

                // miner block reward
                let txReward: Transaction = {
                    to: this.miningAddress,
                    fee: this.blockchainService.softUni2Uni(0),
                    amount: txsFees.add(nodeInfo.blockReward).toString(), // block reward + txs fees
                    timeCreated: (new Date()).getTime()
                };

                txReward.transactionHash = this.blockchainService.calculateTransactionHash(txReward);


                this.nextBlock = {
                    prevBlockHash: nodeInfo.lastBlockHash,
                    difficulty: Number(nodeInfo.difficulty),
                    transactions: [txReward].concat(this.pendingTxs),
                    timeCreated: (new Date()).getTime(),
                    nonce: 0
                }
            }
            else {
                this.nextBlock = undefined;
                console.error('Can\'n get info from the Node!');
            }
        });

        request({
            uri: this.nodeUrl + '/transactions/pending',
            json: true
        }, (error, response, pendingTxs: Transaction[]) => {
            if (!error && response.statusCode == 200) {
                this.pendingTxs = pendingTxs;
            }
            else {
                this.pendingTxs = [];
                this.nextBlock = undefined;
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

        if (hashDifficulty >= this.nextBlock.difficulty) {
            console.log(`Block found!!! Nonce ${this.nextBlock.nonce}; Block Hash: ${blockHash}`);

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
            uri: this.nodeUrl + '/blocks',
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