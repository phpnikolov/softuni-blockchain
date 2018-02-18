import * as express from "express";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as expressValidator from "express-validator/check";
import * as _ from "lodash";
import { CliService } from "./services/cli.service";
import { FaucetController } from "./controllers/faucet.controller";

// mapping address => timestamp (last)
let addrRequest: { [address: string]: number } = {}

let fc: FaucetController;


const app = express();
app.use('/static', express.static(path.resolve('public/static')));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


app.post('/send', [
    expressValidator.check('to', "'to' is required parameter").exists(),

], (req, res) => {
    let errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect('/?&--err=' + encodeURI(_.first(_.map(errors.array(), 'msg'))));
    }


    let addr = req.body['to'];

    let unixtimestamp = (new Date()).getTime(); // milliseconds 
    let minTimeBetweenRequests = 60 * 60 * 1000; // 1 hour in milliseconds

    if (addrRequest[addr] && addrRequest[addr] + minTimeBetweenRequests > unixtimestamp) {
        let timeLeft = Math.ceil((addrRequest[addr] + minTimeBetweenRequests - unixtimestamp) / 60000); // minutes
        return res.redirect('/?&--err=' + encodeURI(`You can receive more SoftUni after ${timeLeft} minutes.`));
    }

    addrRequest[addr] = unixtimestamp;

    fc.sendToAddress(addr).then((txHash: string) => {
        res.redirect('/?&--msg=' + encodeURI('Transaction hash: ' + txHash));

    }, (errMsg: string) => {
        res.redirect('/?&--err=' + encodeURI(errMsg));
    })
});


app.get('/', (req, res) => {
    return res.sendFile(path.resolve('public/index.html'));
});

// Command-line interface
new class extends CliService {
    public init() {

        this.quetion('Set Node hostname', 'localhost').then((nodeHostname: string) => {
            let port: number = 4222;
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