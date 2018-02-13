import * as elliptic from "elliptic";
import * as CryptoJS from "crypto-js";


export class CryptoService {

    public static generatePrivateKey(): string {
        let ec = new elliptic.ec('secp256k1');

        let key = ec.genKeyPair();
    

        return key.getPrivate().toString(16);
    }

    public static getPublicKey(privateKey: string): string {
        let ec = new elliptic.ec('secp256k1');
        let key = ec.keyFromPrivate(privateKey);

        return key.getPublic().encode('hex');
    }

    public static getAddress(publicKey: string): string {
        return CryptoJS.RIPEMD160(publicKey).toString();
    }

    public static getSignature(hexString: string, privateKey: string): string {
        let ec = new elliptic.ec('secp256k1');
        let key = ec.keyFromPrivate(privateKey);
        return key.sign(hexString).toDER('hex');
    }

    public static isValidSignature(hexString:string, signature:string, publicKey:string): boolean {
        let ec = new elliptic.ec('secp256k1');
        let key = ec.keyFromPublic(publicKey, 'hex');

        return key.verify(hexString, signature);
    }
}