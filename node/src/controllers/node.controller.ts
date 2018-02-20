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

    private blockchainService:BlockchainService = new BlockchainService;
    public chain: BlockchainController;
    private peers: PeerController[] = [];

    public constructor(private nodeUrl: string, difficylty: number) {
        this.chain = new BlockchainController(difficylty);

        // donate 100,000 SoftUni to Faucet address
        let txFaucet: Transaction = {
            to: '7c2fda3a3089042b458fe85da748914ea33e2497',
            amount: this.blockchainService.softUni2Uni(100000),
            timeCreated: (new Date()).getTime()
        }
        txFaucet.transactionHash = this.blockchainService.calculateTransactionHash(txFaucet);

        // add genesis block
        this.chain.createBlock([txFaucet], 0, (new Date()).getTime());


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
            origin: this.getOrigin(),
            difficulty: this.chain.difficulty,
            comulativePoW: this.chain.getCumulativePoW(),
            minerReward: this.chain.minerReward,

            blocks: this.chain.getBlocks().length,
            lastBlockHash: this.chain.getLastBlock().blockHash,

            transactions: {
                confirmed: this.chain.getTransactions().length,
                pending: this.chain.getPendingTransactions().length
            },

            peers: this.peers.length
        };

        return info;
    }

    public getOrigin(): string {
        return (new URL(this.nodeUrl)).origin;
    }

    public getPeersOrigins(): string[] {
        return _.map(this.peers, (peer: PeerController) => { return peer.getOrigin(); })
    }

    public addPeer(url: string): boolean {
        // valdation - throw exception on fail
        let urlParsed = new URL(url);

        // http://hodname:port
        let newPeerOrigin = urlParsed.origin;

        if (this.getOrigin() == newPeerOrigin) {
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
            if (info.comulativePoW > that.chain.getCumulativePoW()) {
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
        let extChain = new BlockchainController(0);

        // instance new Blochain and validate all blocks and transactions
        for (let i = 0; i < blocks.length; i++) {
            const block: Block = blocks[i];
            extChain.difficulty = block.difficulty;

            try {
                extChain.createBlock(block.transactions, block.nonce, block.timeCreated);
            }
            catch (ex) {
                console.error(ex);
                return;
            }
        }

        if (extChain.getCumulativePoW() > this.chain.getCumulativePoW()) {
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