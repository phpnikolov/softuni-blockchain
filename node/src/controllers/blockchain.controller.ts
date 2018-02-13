import * as _ from "lodash";
import { Block } from "../interfaces/block";
import { Transaction } from "../interfaces/transaction";
import { BlockchainService } from "../services/blockchain.service";
import { CryptoService } from "../services/crypto.service";


export class BlockchainController {
    private blockchain: Block[] = [];
    public difficulty: number = 4;
    public minerReward: number = 5;
    private pendingTrxs: Transaction[] = [];


    public constructor() {
        this.createGenesisBlock();
    }

    private createGenesisBlock(): void {
        if (this.blockchain.length > 0) {
            return;
        }

        let trxs: Transaction[] = [];

        let block: Block = {
            index: 0,
            prevBlockHash: Array(64).join("0"),
            difficulty: 0,
            transactions: trxs,
            timeCreated: (new Date()).getTime(),
            nonce: 0
        };
        block.blockHash = BlockchainService.calculatekBlockHash(block.prevBlockHash, block.transactions, block.nonce);
        this.blockchain.push(block);
    }


    public createBlock(blockTrxs: Transaction[], nonce: number): boolean {
        let prevBlock: Block = this.getLastBlock();

        let newBlock: Block = {
            index: prevBlock.index + 1,
            prevBlockHash: prevBlock.blockHash,
            difficulty: this.difficulty,
            transactions: blockTrxs,
            timeCreated: (new Date()).getTime(),
            nonce: nonce
        };

        newBlock.blockHash = BlockchainService.calculatekBlockHash(prevBlock.blockHash, newBlock.transactions, newBlock.nonce);

        // set blockHash
        for (let i = 0; i < blockTrxs.length; i++) {
            blockTrxs[i].blockHash = newBlock.blockHash;
        }

        // validate block
        this.validateBlock(newBlock, prevBlock);


        // adds the block to the chain
        this.blockchain.push(newBlock);

        // removes pending transactions
        this.filterPendingTransactions();
        return true;
    }

    public getBlocks(): Block[] {
        return this.blockchain;
    }

    public getBlock(blockHash: string): Block {
        return _.find(this.blockchain, (block: Block) => { return block.blockHash == blockHash; });
    }

    public getLastBlock(): Block {
        return this.blockchain[this.blockchain.length - 1];
    }

    public addPendingTransaction(trx: Transaction): void {
        // check if exists in pending transactions
        if (this.getPendingTransaction(trx.blockHash)) {
             throw 'The transactions is already added.';
        }

        this.validateTrasaction(trx);
        this.pendingTrxs.push(trx);
    }

    public getPendingTransactions(): Transaction[] {
        return this.pendingTrxs;
    }

    public getPendingTransaction(hash: string): Transaction {
        return _.find(this.pendingTrxs, (trx: Transaction) => { return trx.transactionHash == hash; }); 
    }

    public getTransactions(): Transaction[] {
        let trxs: Transaction[] = [];

        for (let i = 0; i < this.blockchain.length; i++) {
            trxs = trxs.concat(this.blockchain[i].transactions);
        }

        return trxs;
    }

    public getTransaction(hash: string): Transaction {
        const trxs: Transaction[] = this.getTransactions();

        return _.find(trxs, (trx: Transaction) => { return trx.transactionHash == hash; });
    }


    private validateBlock(newBlock: Block, prevBlock: Block): void {

        // validate transactions
        for (let i = 0; i < newBlock.transactions.length; i++) {
            const trx: Transaction = newBlock.transactions[i];
            // first transaction must be the miner reward
            let isBlockReward: boolean = (i === 0);


            try {
                this.validateTrasaction(trx, isBlockReward);
                if (trx.blockHash != newBlock.blockHash) {
                    throw 'Incorect block hash.';
                }
            }
            catch (ex) {
                throw `Invalid transaction '${trx.transactionHash}': ` + ex;
            }
        }

        if (newBlock.prevBlockHash !== prevBlock.blockHash) {
            throw 'Invalid previous block hash.';
        }

        if (BlockchainService.calculateHashDifficulty(newBlock.blockHash) < this.difficulty) {
            throw 'Block hash have less difficulty.';
        }
        if (BlockchainService.calculatekBlockHash(prevBlock.blockHash, newBlock.transactions, newBlock.nonce) != newBlock.blockHash) {
            throw 'Invalid block hash.';
        }

    }

    private validateTrasaction(trx: Transaction, isBlockReward: boolean = false): void {
        // don't use <= 0 instead, beacause non numbers (NaN, false, null, string, etc.) will be valid!
        if ((trx.amount > 0) === false) {
            throw 'Balance must be positive number.';
        }
        if (trx.transactionHash != BlockchainService.calculateTransactionHash(trx)) {
            throw 'Invalid transaction hash.';
        }

        if (this.getTransaction(trx.transactionHash)) {
            throw 'The transactions is already in the blockchain.';
        }

        if (isBlockReward) {
            if (trx.from) {
                throw 'From must be empty.';
            }
            if (trx.amount != this.minerReward) {
                throw 'Invalid miner reward.';
            }
        }
        else {
            // validate signature
            if (!CryptoService.isValidSignature(trx.transactionHash, trx.senderSignature, trx.senderPubKey)) {
                throw 'Invalid signature.';
            }
            // Check if sender have enough money
            if (this.getBalance(trx.from) < trx.amount) {
                throw 'Not enough balance.';
            }
        }
    }

    /** 
     * Removes pending transactions already included a block
    */
    private filterPendingTransactions():void {
        _.remove(this.pendingTrxs, (trx: Transaction) => {
            return this.getTransaction(trx.transactionHash);
        });
    }

    private getBalance(address: string): number {
        let balance = 0;

        // confirmed + pending
        let allTrxs: Transaction[] = this.getTransactions().concat(this.getPendingTransactions());

        for (let i = 0; i < allTrxs.length; i++) {
            const trx = allTrxs[i];

            if (trx.to == address) {
                // input transaction, add amount to balance
                balance += trx.amount;
            }
            else if (trx.from == address) {
                // outgoing transaction, subtract amount from balance
                balance -= trx.amount
            }
        }

        return balance;
    }

}