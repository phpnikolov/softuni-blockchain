import { BlockchainController } from "./blockchain.controller";

let pjson = require('../../package.json');

export class NodeController {

    public chain:BlockchainController;

    private nodeId:string;

    public constructor() {
        this.nodeId = (new Date()).getTime().toString(16);
        this.chain = new BlockchainController();
    }


    public getInfo() {
        return {
            about: pjson.description + ' / ' + pjson.version,
            nodeId: this.nodeId,
            difficulty: this.chain.difficulty,
            minerReward: this.chain.minerReward,

            blocks: this.chain.getBlocks().length,
            lastBlockHash: this.chain.getLastBlock().blockHash,

            transactions: {
                confirmed: this.chain.getTransactions().length,
                pending: this.chain.getPendingTransactions().length
            }
        };
    }

}