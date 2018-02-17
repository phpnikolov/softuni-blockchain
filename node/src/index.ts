import * as express from "express";
import * as bodyParser from "body-parser";
import * as expressValidator from "express-validator/check";
import * as cors from "cors";
import * as _ from "lodash";
import * as bigInt from 'big-integer';
import { Transaction } from "./interfaces/transaction";

import { CliService } from "./services/cli.service";
import { NodeController } from "./controllers/node.controller";

let nodeCtrl = new NodeController();

const app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(cors());

// Information about the Node Clien
app.get('/info', (req, res) => {
    return res.json(nodeCtrl.getInfo());
});

// Miners submit their work here
app.post('/blocks', [
    expressValidator.check('transactions', "'transactions' is required parameter").exists(),
    expressValidator.check('nonce', "'nonce' is required parameter").exists()

], (req, res) => {
    let errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: _.first(_.map(errors.array(), 'msg')) });
    }

    let nonce: number = Number(req.body['nonce']) || 0;
    let transactions: Transaction[] = req.body['transactions'];

    try {
        nodeCtrl.chain.createBlock(transactions, nonce);
        return res.status(201).json();
    }
    catch (ex) {
        return res.status(400).json({ error: ex });
    }
});


// Returns all blocks from the blockchain
app.get('/blocks', (req, res) => {
    res.json(nodeCtrl.chain.getBlocks());
});

// Returns block for specified :blockHash
app.get('/blocks/:blockHash', (req, res) => {
    let block = nodeCtrl.chain.getBlock(req.params.blockHash);

    if (block) {
        return res.json(block);
    }

    return res.status(404).json({ error: 'Block not found!' });
});

// Returns transactions for specified :blockHash
app.get('/blocks/:blockHash/transactions', (req, res) => {
    let block = nodeCtrl.chain.getBlock(req.params.blockHash);

    if (block) {
        return res.json(block.transactions);
    }

    return res.status(404).json({ error: 'Block not found!' });
});

// Returns confirmed & pending transactions
app.get('/transactions/', (req, res) => {
    res.json(nodeCtrl.chain.getTransactions());
});

// Returns confirmed transactions
app.get('/transactions/confirmed', (req, res) => {
    res.json(nodeCtrl.chain.getConfirmedTransactions());
});


// Returns pending transactions
app.get('/transactions/pending', (req, res) => {
    return res.json(nodeCtrl.chain.getPendingTransactions());
});

// Create pending transaction
app.post('/transactions/pending', [
    expressValidator.check('transactionHash', "'transactionHash' is required parameter").exists(),
    expressValidator.check('from', "'from' is required parameter").exists(),
    expressValidator.check('to', "'to' is required parameter").exists(),
    expressValidator.check('amount', "'amount' is required parameter").exists(),
    expressValidator.check('senderPubKey', "'senderPubKey' is required parameter").exists(),
    expressValidator.check('senderSignature', "'senderSignature' is required parameter").exists(),
    expressValidator.check('timeCreated', "'timeCreated' is required parameter").exists(),

], (req, res) => {
    let errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error:_.first(_.map(errors.array(), 'msg')) });
    }

    let trx: Transaction = {
        transactionHash: req.body['transactionHash'],
        from: req.body['from'],
        to: req.body['to'],
        amount: bigInt(req.body['amount']),
        senderPubKey: req.body['senderPubKey'],
        senderSignature: req.body['senderSignature'],
        timeCreated: Number(req.body['timeCreated']),
    }

    try {
        nodeCtrl.chain.addPendingTransaction(trx);
        return res.status(201).json();
    }
    catch (ex) {
        return res.status(400).json({ error: ex });
    }
});


// 	Returns transaction for specified :trxHash
app.get('/transactions/:trxHash', (req, res) => {
    let trx = nodeCtrl.chain.getTransaction(req.params.trxHash);

    if (trx) {
        return res.json(trx);
    }

    return res.status(404).json({ error: 'Transaction not found!' });
});


// Returns confirmed & pending transactions for specified :address
app.get('/address/:address/transactions/', (req, res) => {
    let address:string = req.params.address;
    let txs:Transaction[] = nodeCtrl.chain.getTransactions();

    let addrTrxs = _.filter(txs, (trx: Transaction) => { return trx.to == address || trx.from == address; });
    return res.json(addrTrxs);
});

// Returns confirmed transactions for specified :address
app.get('/address/:address/transactions/confirmed', (req, res) => {
    let address:string = req.params.address;
    let confirmedTrxs:Transaction[] = nodeCtrl.chain.getConfirmedTransactions();

    let addrTrxs = _.filter(confirmedTrxs, (trx: Transaction) => { return trx.to == address || trx.from == address; });
    return res.json(addrTrxs);
});

// Returns pending transactions for specified :address
app.get('/address/:address/transactions/pending', (req, res) => {
    let address:string = req.params.address;
    let pendingTrxs:Transaction[] = nodeCtrl.chain.getPendingTransactions();

    let addrTrxs = _.filter(pendingTrxs, (trx: Transaction) => { return trx.to == address || trx.from == address; });
    return res.json(addrTrxs);
});

// Command-line interface
new class extends CliService {
    public init() {
        this.quetion('Set block difficulty', nodeCtrl.chain.difficulty.toString()).then((dificulty: string) => {
            nodeCtrl.chain.difficulty = parseInt(dificulty);

            this.quetion('Set Server hostname', 'localhost').then((hostname: string) => {
                let port:number = 5555;
                app.listen(port, hostname, () => {
                    console.log(`\nServer started: http://${hostname}:${port}`);
                    this.rl.close();
                }).on('error', (err: Error) => {
                    console.error(`\nError: Can't start server http://${hostname}:${port}`);
                });
            });
        });
    }
};