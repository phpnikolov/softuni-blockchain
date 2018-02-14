import * as elliptic from "elliptic";
import * as CryptoJS from "crypto-js";

export class CryptoService {
    public ec = new elliptic.ec('secp256k1');

    public generatePrivateKey(): string {
        let key = this.ec.genKeyPair();
    
        return key.getPrivate().toString(16);
    }

    public getPublicKey(privateKey: string): string {
        let key = this.ec.keyFromPrivate(privateKey);

        return key.getPublic().encode('hex');
    }

    public getAddress(publicKey: string): string {
        return CryptoJS.RIPEMD160(publicKey).toString();
    }

    public getSignature(hexString: string, privateKey: string): string {
        let key = this.ec.keyFromPrivate(privateKey);
        return key.sign(hexString).toDER('hex');
    }

    public isValidSignature(hexString:string, signature:string, publicKey:string): boolean {
        let key = this.ec.keyFromPublic(publicKey, 'hex');

        return key.verify(hexString, signature);
    }
}