import { CryptoService } from "../services/crypto.service";
import { Transaction } from "../interfaces/transaction";
import { BlockchainService } from "../services/blockchain.service";
import * as request from 'request';

export class FaucetController {
    private crypto = new CryptoService;
    private blockchain = new BlockchainService;

    private privateKey = 'c7492c9fe6ba43a15a138e7710d656c897bcf25e5358c3789432ad6b43f4f416';

    private nodeUri: string;

    public constructor(
        private nodeHostname: string
    ) {
        this.nodeUri = `http://${this.nodeHostname}:5555`;
    }


    private getPublicKey(): string {
        return this.crypto.getPublicKey(this.privateKey);
    }

    public getAddress(): string {
        return this.crypto.getAddress(this.getPublicKey());
    }

    public sendToAddress(address: string): Promise<string> {
        let trx: Transaction = {
            from: this.getAddress(),
            to: address,
            amount: this.blockchain.softUni2Uni(1),
            timeCreated: (new Date()).getTime(),
        };

        // create transaction hash
        trx.transactionHash = this.blockchain.calculateTransactionHash(trx);

        // sign transaction hash
        trx.senderSignature = this.crypto.getSignature(trx.transactionHash, this.privateKey);

        // add public key
        trx.senderPubKey = this.getPublicKey();

        return new Promise((resolve, reject) => {
            request({
                method: 'POST',
                uri: this.nodeUri + '/transactions/pending/',
                body: trx,
                json: true
            }, (error, response, body) => {
                if (!error && response.statusCode == 201) {
                    resolve(trx.transactionHash);
                }
                else {
                    console.error(body);
                    reject('Node rejected the transaction! Please contact technical support.');
                }
            });
        });



    }

}