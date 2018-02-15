import * as express from "express";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as expressValidator from "express-validator/check";
import * as _ from "lodash";
import { CliService } from "./services/cli.service";
import { FaucetController } from "./controllers/faucet.controller";


let fc: FaucetController;


const app = express();
app.use('/static', express.static(path.resolve('public/static')));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// Create pending transaction
app.post('/send', [
    expressValidator.check('to', "'to' is required parameter").exists(),

], (req, res) => {
    let errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: _.first(_.map(errors.array(), 'msg')) });
    }

    fc.sendToAddress(req.body['to']).then((txHash: string) => {
        res.redirect('/?&--msg=' + encodeURI('Transaction hash: ' + txHash));

    }, (errMsg: string) => {
        res.redirect('/?&--err=' + encodeURI(errMsg));
    })
});

// Returns pending transactions for specified :address
app.get('/', (req, res) => {

    return res.sendFile(path.resolve('public/index.html'));
});

// Command-line interface
new class extends CliService {
    public init() {

        this.quetion('Set Node hostname', 'localhost').then((nodeHostname: string) => {
            let port: number = 4201;
            app.listen(port, () => {
                fc = new FaucetController(nodeHostname);
                this.rl.close();

                console.log(`\nFaucet url: http://localhost:${port}`);
                console.log('Faucet address: ' + fc.getAddress());
            }).on('error', (err: Error) => {
                console.error(`\nError: Can't start server http://localhost:${port}`);
            });
        });

    }
};