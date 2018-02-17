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
    private util = this.blockchainService.util;

    private blockchain: Block[] = [];
    public difficulty: number = 4;
    public minerReward: BigInteger = this.util.toUni(5, this.util.units.softuni); // 5 SoftUni
    private pendingTrxs: Transaction[] = [];


    public constructor() {
        this.createGenesisBlock();
    }

    private createGenesisBlock(): void {
        if (this.blockchain.length > 0) {
            return;
        }

        // donate 100,000 SoftUni to Faucet address
        let txFaucet: Transaction = {
            to: '7c2fda3a3089042b458fe85da748914ea33e2497',
            amount: this.util.toUni(100000, this.util.units.softuni).toString(10),
            timeCreated: (new Date()).getTime()
        }

        txFaucet.transactionHash = this.blockchainService.calculateTransactionHash(txFaucet);

        let block: Block = {
            index: 0,
            prevBlockHash: Array(64).join("0"),
            difficulty: 0,
            transactions: [txFaucet],
            timeCreated: (new Date()).getTime(),
            nonce: 0
        };
        block.blockHash = this.blockchainService.calculatekBlockHash(block.prevBlockHash, block.transactions, block.nonce);

        for (let i = 0; i < block.transactions.length; i++) {
            block.transactions[i].blockHash = block.blockHash;
        }

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

        newBlock.blockHash = this.blockchainService.calculatekBlockHash(prevBlock.blockHash, newBlock.transactions, newBlock.nonce);

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
        if (this.getPendingTransaction(trx.transactionHash)) {
            throw 'The transactions is already added.';
        }
        // pending transactions should not have blockHash
        trx.blockHash = undefined;

        this.validateTrasaction(trx);
        this.pendingTrxs.push(trx);
    }

    public getPendingTransactions(): Transaction[] {
        return this.pendingTrxs;
    }

    public getPendingTransaction(hash: string): Transaction {
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
        // confirmed + pending
        return this.getConfirmedTransactions().concat(this.getPendingTransactions());
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
        if (this.blockchainService.calculatekBlockHash(prevBlock.blockHash, newBlock.transactions, newBlock.nonce) != newBlock.blockHash) {
            throw 'Invalid block hash.'
        }

        if (this.blockchainService.calculateHashDifficulty(newBlock.blockHash) < this.difficulty) {
            throw 'Block hash have less difficulty.';
        }


    }

    private validateTrasaction(trx: Transaction, isBlockReward: boolean = false): void {
        let trxAmount:BigInteger = bigInt(trx.amount);
        if (trxAmount.lesserOrEquals(0)) {
            throw 'Balance must be greater than 0.';
        }
        if (trx.transactionHash != this.blockchainService.calculateTransactionHash(trx)) {
            throw 'Invalid transaction hash.';
        }

        if (this.getConfirmedTransaction(trx.transactionHash)) {
            throw 'The transactions is already in the blockchain.';
        }

        if (isBlockReward) {
            if (trx.from) {
                throw 'From must be empty.';
            }
            if (trxAmount.notEquals(this.minerReward)) {
                throw 'Invalid miner reward.';
            }
        }
        else {
            // validate sender address with public key
            if (this.cryptoService.getAddress(trx.senderPubKey) !== trx.from) {
                throw 'Sender address didn\'t match with Public Key'
            }

            // validate signature
            if (!this.cryptoService.isValidSignature(trx.transactionHash, trx.senderSignature, trx.senderPubKey)) {
                throw 'Invalid signature.';
            }
            // Check if sender have enough money
            let senderBalance:BigInteger = this.blockchainService.calculateBalance(trx.from, this.getConfirmedTransactions(), this.getPendingTransactions());
            if (senderBalance.lesser(trx.amount)) {
                throw 'Not enough balance.';
            }
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
}