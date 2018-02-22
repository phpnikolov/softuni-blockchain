import * as express from "express";
import * as bodyParser from "body-parser";
import * as expressValidator from "express-validator/check";
import * as cors from "cors";
import * as _ from "lodash";
import { Transaction } from "./interfaces/transaction";

import { CliService } from "./services/cli.service";
import { NodeController } from "./controllers/node.controller";
import { PeerController } from "./controllers/peer.controller";

let nodeCtrl: NodeController;

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

    let timeCreated = Number(req.body['timeCreated']) || (new Date()).getTime();

    try {
        nodeCtrl.chain.createBlock(transactions, nonce, timeCreated);

        // send this block to all peers
        let peers = nodeCtrl.getPeers();
        peers.forEach(peer => {
            peer.addBlock(transactions, nonce, timeCreated).then(() => {

            }).catch(() => {

            });
        });

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
    expressValidator.check('fee', "'fee' is required parameter").exists(),
    expressValidator.check('senderPubKey', "'senderPubKey' is required parameter").exists(),
    expressValidator.check('senderSignature', "'senderSignature' is required parameter").exists(),
    expressValidator.check('timeCreated', "'timeCreated' is required parameter").exists(),

], (req, res) => {
    let errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: _.first(_.map(errors.array(), 'msg')) });
    }

    let trx: Transaction = {
        transactionHash: req.body['transactionHash'],
        from: req.body['from'],
        to: req.body['to'],
        amount: req.body['amount'],
        fee: req.body['fee'],
        senderPubKey: req.body['senderPubKey'],
        senderSignature: req.body['senderSignature'],
        timeCreated: Number(req.body['timeCreated']),
    }

    try {
        nodeCtrl.chain.addPendingTransaction(trx);

        // send this transaction to all peers
        let peers = nodeCtrl.getPeers();
        peers.forEach(peer => {
            peer.addPendingTransaction(trx).then(() => {

            }).catch(() => {
                
            });
        });

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
    let address: string = req.params.address;
    let txs: Transaction[] = nodeCtrl.chain.getTransactions();

    let addrTrxs = _.filter(txs, (trx: Transaction) => { return trx.to == address || trx.from == address; });
    return res.json(addrTrxs);
});

// Returns confirmed transactions for specified :address
app.get('/address/:address/transactions/confirmed', (req, res) => {
    let address: string = req.params.address;
    let confirmedTrxs: Transaction[] = nodeCtrl.chain.getConfirmedTransactions();

    let addrTrxs = _.filter(confirmedTrxs, (trx: Transaction) => { return trx.to == address || trx.from == address; });
    return res.json(addrTrxs);
});

// Returns pending transactions for specified :address
app.get('/address/:address/transactions/pending', (req, res) => {
    let address: string = req.params.address;
    let pendingTrxs: Transaction[] = nodeCtrl.chain.getPendingTransactions();

    let addrTrxs = _.filter(pendingTrxs, (trx: Transaction) => { return trx.to == address || trx.from == address; });
    return res.json(addrTrxs);
});

// Get peers
app.get('/peers', (req, res) => {
    return res.json(nodeCtrl.getPeersOrigins());
});

app.post('/peers', [
    expressValidator.check('url', "'url' is required parameter").exists()
], (req, res) => {
    let errors = expressValidator.validationResult(req).array();
    if (errors.length > 0) {
        return res.status(400).json({ error: errors[0].msg });
    }

    try {
        let isAdded: boolean = nodeCtrl.addPeer(req.body['url']);
        return res.status(isAdded ? 201 : 200).json();
    }
    catch (ex) {
        console.log(ex);
        return res.status(400).json({ error: ex });
    }
});

// Command-line interface
new class extends CliService {
    public init() {
        this.quetion('Set block difficulty', '4').then((dificulty: string) => {

            this.quetion('Set Server hostname', '127.0.0.1').then((hostname: string) => {
                let port: number = 5555;
                let nodeUrl = `http://${hostname}:${port}`;
                app.listen(port, hostname, () => {
                    console.log(`\nServer started: ${nodeUrl}`);
                    nodeCtrl = new NodeController(nodeUrl, parseInt(dificulty));
                    this.showMenu();

                }).on('error', (err: Error) => {
                    console.error(`\nError: Can't start server ${nodeUrl}`);
                    process.exit(0);
                });
            }).catch(process.exit);
        }).catch(process.exit);
    }

    public showMenu() {
        this.quetion(`\nEnter operation ['info', 'add-peer', 'difficulty' 'exit']`).then((operation) => {
            operation = operation.toLocaleLowerCase().trim();
            switch (operation) {
                case 'info':
                    console.log(JSON.stringify(nodeCtrl.getInfo(), null, 2));
                    this.showMenu();
                    break;

                case 'add-peer':
                    this.quetion('Enter peer url').then((url: string) => {
                        try {
                            let res = nodeCtrl.addPeer(url);
                            if (res) {
                                console.log('Peer is added');
                            }
                            else {
                                console.log('This peer awready exists');
                            }
                        }
                        catch (ex) {
                            console.error(ex);
                        }
                        this.showMenu();
                    }).catch(() => {
                        this.showMenu();
                    });
                    break;

                case 'difficulty':
                    this.quetion('Enter difficulty', nodeCtrl.chain.difficulty.toString()).then((difficulty: string) => {
                        nodeCtrl.chain.difficulty = parseInt(difficulty);
                        console.log('Difficulty is now: ' + nodeCtrl.chain.difficulty);
                        this.showMenu();
                    }).catch(() => {
                        this.showMenu();
                    });
                    break;

                default:
                    console.log(`Invalid operation '${operation}'`);
                    this.showMenu();
                    break;
            }
        }).catch(process.exit);
    }
};