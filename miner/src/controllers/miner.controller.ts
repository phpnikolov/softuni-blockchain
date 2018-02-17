import * as request from 'request';
import { setInterval } from "timers";
import { BlockchainService } from "../services/blockchain.service";
import { Transaction } from '../interfaces/transaction';


export class MinerController {
    private blockchainService:BlockchainService = new BlockchainService;
    private nodeUri: string;

    private lastBlockHash: string;
    private difficulty: number;
    private minerReward: string;
    private pendingTransactions: Transaction[];

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
                this.lastBlockHash = body.lastBlockHash;
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
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                // add miner reward transaction
                let trxReward: Transaction = {
                    to: this.miningAddress,
                    amount: this.minerReward,
                    timeCreated: (new Date()).getTime()
                };

                trxReward.transactionHash = this.blockchainService.calculateTransactionHash(trxReward);

                body.unshift(trxReward);

                this.pendingTransactions = body;
            }
            else {
                console.error('Can\'n get pending transactions from the Node!');
            }
        });
    }


    private mine(nonce: number = 0): void {
        if (!this.lastBlockHash || !this.minerReward || this.pendingTransactions.length === 0) {
            setTimeout(() => {
                this.mine(nonce);
            }, 100);
            return;
        }

        let blockHash = this.blockchainService.calculatekBlockHash(this.lastBlockHash, this.pendingTransactions, nonce);
        this.processedHashes++;
        let hashDifficulty:number = this.blockchainService.calculateHashDifficulty(blockHash);

        if (hashDifficulty >= this.difficulty) {
            console.log(`Block found!!! Nonce ${nonce}; Hash: ${blockHash}`);
            this.submitBlock(this.pendingTransactions, nonce);
            this.lastBlockHash = undefined;
            this.pendingTransactions = undefined;
            this.minerReward = undefined;
            this.lastBlockHash = undefined;
        }
        else {
            nonce++;
            setTimeout(() => {
                this.mine(nonce);
            }, 0);
        }
    }


    private submitBlock(transactions: Transaction[], nonce: number): void {
        request({
            method: 'POST',
            uri: this.nodeUri + '/blocks',
            json: {
                transactions: transactions,
                nonce: nonce
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 201) {
                console.log('Block is accepted.');
                this.sync();
            }
            else {
                console.error('Error: Block is rejected!', body);
            }

            this.sync();
            this.mine(0);
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