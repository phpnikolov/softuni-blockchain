import * as _ from "lodash";
import { Block } from "../interfaces/block";
import { Transaction } from "../interfaces/transaction";
import { BlockchainService } from "../services/blockchain.service";
import { CryptoService } from "../services/crypto.service";
import { BigInteger } from 'big-integer';
import * as bigInt from 'big-integer';


export class BlockchainController {
    private cryptoService: CryptoService = new CryptoService;
    private blockchainService: BlockchainService = new BlockchainService;


    private blockchain: Block[] = [];
    public minerReward: string = this.blockchainService.softUni2Uni(5); // 5 SoftUni
    private pendingTrxs: Transaction[] = [];
    public difficulty: number = 4


    public constructor() {

    }

    public createBlock(nextBlock: Block): boolean {

        nextBlock.blockHash = this.blockchainService.calculatekBlockHash(nextBlock);

        // set blockHash
        for (let i = 0; i < nextBlock.transactions.length; i++) {
            nextBlock.transactions[i].blockHash = nextBlock.blockHash;
        }

        // validate block
        if (this.blockchain.length === 0) {
            // skip validation for the genesis block
        }
        else {
            this.validateBlock(nextBlock, this.getLastBlock());
        }
        
        // adds the block to the chain
        this.blockchain.push(nextBlock);

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
        let chainLength = this.blockchain.length;
        if (chainLength > 0) {
            return this.blockchain[chainLength - 1];
        }
    }

    public addPendingTransaction(trx: Transaction): void {
        // check if exists in pending transactions
        if (this.getPendingTransaction(trx.transactionHash)) {
            throw 'The transactions is already added.';
        }
        // pending transactions should not have blockHash
        trx.blockHash = undefined;

        this.validateTrasaction(trx);
        this.pendingTrxs.push(trx);
    }

    public getPendingTransactions(): Transaction[] {
        this.filterPendingTransactions();
        return this.pendingTrxs;
    }

    public getPendingTransaction(hash: string): Transaction {
        this.filterPendingTransactions();
        return _.find(this.pendingTrxs, (trx: Transaction) => { return trx.transactionHash == hash; });
    }

    public getConfirmedTransactions(): Transaction[] {
        return _.flatten(_.map(this.blockchain, 'transactions'));
    }

    public getConfirmedTransaction(hash: string): Transaction {
        const trxs: Transaction[] = this.getConfirmedTransactions();

        return _.find(trxs, (trx: Transaction) => { return trx.transactionHash == hash; });
    }

    public getTransactions(): Transaction[] {
        this.filterPendingTransactions();
        // confirmed + pending
        return this.getConfirmedTransactions().concat(this.getPendingTransactions());
    }

    public getTransaction(hash: string): Transaction {
        const trxs: Transaction[] = this.getTransactions();

        return _.find(trxs, (trx: Transaction) => { return trx.transactionHash == hash; });
    }


    private validateBlock(newBlock: Block, prevBlock: Block): void {
        let minerReward = bigInt(this.minerReward);

        newBlock.transactions.forEach(tx => {
            minerReward = minerReward.add(tx.fee);
        });

        // validate transactions
        for (let i = 0; i < newBlock.transactions.length; i++) {
            const trx: Transaction = newBlock.transactions[i];

            // first transaction must be the miner reward
            let isBlockReward: boolean = (i === 0);

            try {
                if (_.find(newBlock.transactions, ['transactionHash', trx.transactionHash]) > 1) {
                    throw 'Duplicate transaction hash.'
                }

                if (trx.blockHash != newBlock.blockHash) {
                    throw 'Incorect block hash.';
                }

                if (isBlockReward) {
                    this.valdiateRewardTransaction(trx, minerReward);
                }
                else {
                    this.validateTrasaction(trx);
                }
            }
            catch (ex) {
                throw `Invalid transaction '${trx.transactionHash}': ` + ex;
            }
        }

        if (newBlock.prevBlockHash !== prevBlock.blockHash) {
            throw 'Invalid previous block hash.';
        }
        
        if (this.blockchainService.calculatekBlockHash(newBlock) != newBlock.blockHash) {
            throw 'Invalid block hash.'
        }

        if (this.blockchainService.calculateHashDifficulty(newBlock.blockHash) < this.difficulty) {
            throw 'Block hash have less difficulty.';
        }
    }

    private valdiateRewardTransaction(trx:Transaction, reward:BigInteger) {
        let trxAmount: BigInteger = bigInt(trx.amount);
        let trxFee: BigInteger = bigInt(trx.fee);

        if (trx.transactionHash != this.blockchainService.calculateTransactionHash(trx)) {
            throw 'Invalid transaction hash.';
        }

        if (trx.from) {
            throw 'From must be empty.';
        }

        if (trxAmount.notEquals(reward)) {
            throw 'Invalid miner reward.';
        }
        if (trxFee.notEquals(0)) {
            throw 'Fee must be 0 for miners reward.';
        }
    }

    private validateTrasaction(trx: Transaction): void {
        let trxAmount: BigInteger = bigInt(trx.amount);
        let trxFee: BigInteger = bigInt(trx.fee);

        if (trxAmount.lesserOrEquals(0)) {
            throw 'Balance must be greater than 0.';
        }

        if (trx.transactionHash != this.blockchainService.calculateTransactionHash(trx)) {
            throw 'Invalid transaction hash.';
        }

        if (this.getConfirmedTransaction(trx.transactionHash)) {
            throw 'The transactions is already in the blockchain.';
        }

        // validate sender address with public key
        if (this.cryptoService.getAddress(trx.senderPubKey) !== trx.from) {
            throw 'Sender address didn\'t match with Public Key'
        }

        // validate fee
        if (trxFee.lesser(this.blockchainService.MIN_TRANSACTION_FEE)) {
            throw `Fee must be greater than ${this.blockchainService.MIN_TRANSACTION_FEE}.`;
        }

        // validate signature
        if (!this.cryptoService.isValidSignature(trx.transactionHash, trx.senderSignature, trx.senderPubKey)) {
            throw 'Invalid signature.';
        }
        // Check if sender have enough money
        let senderBalance: BigInteger = this.blockchainService.calculateBalance(trx.from, this.getConfirmedTransactions(), this.getPendingTransactions());
        if (senderBalance.lesser(trx.amount)) {
            throw 'Not enough balance.';
        }
        
    }

    /** 
     * Removes pending transactions already included a block
    */
    private filterPendingTransactions(): void {
        _.remove(this.pendingTrxs, (trx: Transaction) => {
            return this.getConfirmedTransaction(trx.transactionHash);
        });
    }

    /**
     * unit to measure PoW for entire blockchain
     * SUM(16^block difficulty)
     */
    public getCumulativePoW(): number {
        let comulativePow: number = 0;

        this.blockchain.forEach(block => {
            comulativePow += Math.pow(16, block.difficulty);
        });

        return comulativePow;
    }
}