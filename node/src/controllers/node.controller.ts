import { BlockchainController } from "./blockchain.controller";
import { PeerController } from "./peer.controller";
import * as CryptoJS from "crypto-js";
import * as _ from 'lodash';
import { NodeInfo } from "../interfaces/node-info";
import { URL } from "url";
import { Block } from "../interfaces/block";
import { Transaction } from "../interfaces/transaction";
import { BlockchainService } from "../services/blockchain.service";

let pjson = require('../../package.json');

export class NodeController {

    private blockchainService: BlockchainService = new BlockchainService;
    public chain: BlockchainController;
    private peers: PeerController[] = [];

    public constructor(private nodeUrl: string) {
        this.chain = new BlockchainController();

        // donate 100,000 SoftUni to Faucet address
        let txFaucet: Transaction = {
            to: '7c2fda3a3089042b458fe85da748914ea33e2497',
            fee: this.blockchainService.softUni2Uni(0),
            amount: this.blockchainService.softUni2Uni(100000),
            timeCreated: (new Date()).getTime()
        }
        txFaucet.transactionHash = this.blockchainService.calculateTransactionHash(txFaucet);

        let genesisBlock: Block = {
            prevBlockHash: Array(65).join('0'), // 64 zeroes
            transactions: [txFaucet],
            timeCreated: (new Date()).getTime(),
            nonce: 0
        }

        // add genesis block
        this.chain.createBlock(genesisBlock);


        // Sync with other nodes
        setInterval(() => {
            this.peers.forEach(peer => {
                this.checkForLongerChain(peer);
                this.syncPendingTransactions(peer);
                this.syncPeers(peer);
            });
        }, 5000);
    }


    public getInfo(): NodeInfo {
        let info: NodeInfo = {
            about: pjson.description + ' / ' + pjson.version,
            nodeUrl: this.getNodeUrl(),
            difficulty: this.chain.difficulty,
            cumulativeDifficulty: this.chain.getCumulativeDifficulty(),
            blockReward: this.chain.blockReward,

            blocksCount: this.chain.getBlocks().length,
            lastBlockHash: this.chain.getLastBlock().blockHash,

            transactions: {
                confirmedCount: this.chain.getConfirmedTransactions().length,
                pendingCount: this.chain.getPendingTransactions().length
            },

            peersCount: this.peers.length
        };

        return info;
    }

    public getNodeUrl(): string {
        return (new URL(this.nodeUrl)).origin;
    }

    public getPeersOrigins(): string[] {
        return _.map(this.peers, (peer: PeerController) => { return peer.getNodeUrl(); })
    }

    public addPeer(url: string): boolean {
        // valdation - throw exception on fail
        let urlParsed = new URL(url);

        // http://hodname:port
        let newPeerOrigin = urlParsed.origin;

        if (this.getNodeUrl() == newPeerOrigin) {
            // this is our node
            return false;
        }

        if (this.getPeersOrigins().indexOf(newPeerOrigin) > -1) {
            // peers exists
            return false;
        }

        let peer = new PeerController(newPeerOrigin)
        this.peers.push(peer);

        // tell the peer that you exist
        peer.addPeer(this.nodeUrl);

        // sync pending-transactions, blockchain and peers with the new peer
        this.syncPendingTransactions(peer);
        this.checkForLongerChain(peer);
        this.syncPeers(peer);
        return true;
    }

    public getPeers(): PeerController[] {
        return this.peers;
    }

    private syncPendingTransactions(peer: PeerController) {
        let that = this;
        peer.getPendingTransactions().then((txs: Transaction[]) => {
            txs.forEach(tx => {
                try {
                    that.chain.addPendingTransaction(tx);
                }
                catch (ex) {

                }
            });

        }).catch(() => {
            this.reportBadPeer(peer);
        });
    }

    private syncPeers(peer: PeerController) {
        let that = this;

        peer.getPeers().then((urls: string[]) => {
            urls.forEach(url => {
                try {
                    that.addPeer(url);
                }
                catch (ex) {

                }
            });
        }).catch(() => {
            this.reportBadPeer(peer);
        });

    }

    private checkForLongerChain(peer: PeerController) {
        let that = this;
        peer.getInfo().then((info: NodeInfo) => {
            if (info.cumulativeDifficulty > that.chain.getCumulativeDifficulty()) {
                // longer chain, get it and check it
                peer.getBlockchain().then((blocks: Block[]) => {
                    that.approveNewChain(blocks);
                }).catch(() => {
                    this.reportBadPeer(peer);
                });
            }
        }).catch(() => {
            this.reportBadPeer(peer);
        });

    }

    private approveNewChain(blocks: Block[]) {
        let extChain = new BlockchainController();

        // instance new Blochain and validate all blocks and transactions
        for (let i = 0; i < blocks.length; i++) {
            const block: Block = blocks[i];
            extChain.difficulty = block.difficulty;

            try {
                extChain.createBlock(block);
            }
            catch (ex) {
                console.error(ex);
                return;
            }
        }

        if (extChain.getCumulativeDifficulty() > this.chain.getCumulativeDifficulty()) {
            // new longer chain
            this.chain = extChain;
        }
    }


    private reportBadPeer(peer: PeerController) {
        /**
         * @todo: count errors and disconnect peers with many errors
         */
    }

}