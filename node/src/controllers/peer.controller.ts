import { Transaction } from "../interfaces/transaction";
import { Block } from "../interfaces/block";
import * as request from "request";
import { NodeInfo } from "../interfaces/node-info";

export class PeerController {


    public constructor(private origin: string) {

    }

    public getOrigin(): string {
        return this.origin;
    }

    public getInfo(): Promise<NodeInfo> {
        return this.request('GET', '/info');
    }

    public getBlockchain(): Promise<Block[]> {
        return this.request('GET', '/blocks');
    }

    public getPendingTransactions(): Promise<Transaction[]> {
        return this.request('GET', '/transactions/pending');
    }
    
    public getPeers(): Promise<string[]> {
        return this.request('GET', '/peers');
    }

    public addPeer(url: string): Promise<any> {
        return this.request('POST', '/peers', { url: url });
    }

    public addPendingTransaction(tx: Transaction): Promise<any> {
        return this.request('POST', '/tranactions/pending', tx);
    }

    public addBlock(block: Block): Promise<any> {
        return this.request('POST', '/blocks', block);
    }

    private request(method: string, path: string, data?): Promise<any> {
        return new Promise((resolve, reject) => {
            request({
                method: method,
                uri: this.origin + path,
                body: data,
                json: true
            }, (error, response, body) => {
                if (!error && response.statusCode < 400) {
                    resolve(body);
                }
                else {
                    reject(body);
                }
            });
        });

    }


}