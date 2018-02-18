import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import * as _ from "lodash";
import * as CryptoJS from "crypto-js";

import { StorageService } from './services/storage.service';
import { BlockchainService } from './services/blockchain.service';

import { CryptoAccount } from './interfaces/crypto-account';

import { Transaction } from './interfaces/transaction';
import { CryptoService } from './services/crypto.service';
import { BigInteger } from 'big-integer';
import * as bigInt from 'big-integer';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public readonly env = environment;
  public accounts: CryptoAccount[];
  public accountsTrxs: { string: Transaction[] }[] = [];
  public selectedAccount: CryptoAccount;

  public trxRecipient: string;
  public trxAmount: number;

  public fg: FormGroup = new FormGroup({
    'recipient': new FormControl({
      validators: [Validators.required],
    }),
    'amount': new FormControl({
      validators: [Validators.required]
    })
  });


  public constructor(
    private storage: StorageService,
    public blockchain: BlockchainService,
    private crypto: CryptoService,
    private httpClient: HttpClient,
  ) {
    this.accounts = storage.getVal('accounts') || [];

    this.useAccount(0);
    this.syncAllAccountsTrxs();

    // sync all accounts every 5 sec
    setInterval(() => {
      this.syncAllAccountsTrxs();
    }, 5000);
  }


  public createAccount(privateKey?: string): void {
    if (!privateKey) {
      privateKey = this.crypto.generatePrivateKey();
    }

    let publicKey = this.crypto.getPublicKey(privateKey);
    let address = this.crypto.getAddress(publicKey);

    let accountName = prompt("Account name:", 'Account ' + (this.accounts.length + 1));
    if (accountName == null) {
      return; // cancel
    }

    let pwd = prompt("Please enter password:");
    if (pwd == null) {
      return; // cancel
    }

    let account: CryptoAccount = {
      privateKey: (pwd.length > 0 ? CryptoJS.AES.encrypt(privateKey, pwd).toString() : privateKey), // encrypted private key if password is set
      publicKey: publicKey,
      address: address,
      name: accountName
    };

    let idx = this.accounts.push(account) - 1;
    this.storeAccounts();
    this.useAccount(idx);
  }

  public importAccount(): void {
    let privateKey = prompt("Enter private key:");
    if (privateKey != null) {
      this.createAccount(privateKey);
    }
  }

  private storeAccounts(): void {
    this.storage.setVal('accounts', this.accounts);
  }

  public useAccount(accountIdx: number): void {
    if (typeof this.accounts[accountIdx] !== 'undefined') {
      this.selectedAccount = this.accounts[accountIdx];
    }
    else {
      this.selectedAccount = undefined;
    }
  }

  public showPrivateKey(account: CryptoAccount): void {
    let privateKey = this.unlockPrivateKey(account.privateKey);
    if (privateKey) {
      alert(privateKey);
    }

  }

  public renameAccount(account: CryptoAccount): void {
    let accountName = prompt("Please enter name:", account.name);
    if (accountName) {
      account.name = accountName;
      this.storeAccounts();
    }
  }
  public deleteAccount(account: CryptoAccount): void {
    if (confirm(`Want to '${account.address}'?`)) {
      let idx = this.accounts.indexOf(account);
      if (idx > -1) {
        this.accounts.splice(idx, 1);
      }

      this.storeAccounts();
      this.useAccount(0);
    }
  }

  private unlockPrivateKey(privateKey: string): string {
    let pwd = prompt("Please enter password:");
    if (pwd == null) {
      return; // cancel
    }

    let decryptedPrivateKey: string;

    if (pwd.length === 0) {
      // no password
      decryptedPrivateKey = privateKey;
    }
    else {
      try {
        decryptedPrivateKey = CryptoJS.AES.decrypt(privateKey, pwd).toString(CryptoJS.enc.Utf8);
      }
      catch (ex) {
      }
    }


    if (!decryptedPrivateKey || decryptedPrivateKey.length != 64) {
      alert('Wrong password!' + decryptedPrivateKey);
    }

    return decryptedPrivateKey;
  }

  public sendTransaction(account: CryptoAccount) {
    let trx: Transaction = {
      from: account.address,
      to: this.trxRecipient,
      amount: this.blockchain.softUni2Uni(this.trxAmount),
      timeCreated: (new Date()).getTime(),
      senderPubKey: account.publicKey
    };

    // create transaction hash
    trx.transactionHash = this.blockchain.calculateTransactionHash(trx);

    // sign transaction hash
    let privateKey = this.unlockPrivateKey(account.privateKey);
    if (!privateKey) {
      return; // cancel
    }
    trx.senderSignature = this.crypto.getSignature(trx.transactionHash, privateKey);

    if (confirm('Confirm sending: ' + JSON.stringify(trx, null, 2))) {
      this.trxAmount = undefined;
      this.trxRecipient = undefined;

      this.httpClient.request('POST', `${this.env.nodeUrl}/transactions/pending/`, {
        body: trx,
        observe: 'body',
        responseType: 'json'
      }).subscribe(
        (data) => {
          console.log('Transaction success!')
        },
        (httpErr) => {
          console.error('Transaction error: ', httpErr);
        });
      this.syncAccountTrxs(account);
    }
  }

  private syncAccountTrxs(account: CryptoAccount): void {
    // get confirmed+pending
    this.httpClient.request('GET', `${this.env.nodeUrl}/address/${account.address}/transactions`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Transaction[]) => {
        this.accountsTrxs[account.address] = _.orderBy(data, ['timeCreated'], ['desc']);
      });
  }


  private syncAllAccountsTrxs(): void {
    for (let i = 0; i < this.accounts.length; i++) {
      this.syncAccountTrxs(this.accounts[i]);
    }
  }

  public getAccountTxs(account: CryptoAccount): Transaction[] {
    return this.accountsTrxs[account.address] || [];
  }

  public getAccountBalance(account: CryptoAccount): BigInteger {
    let allTxs: Transaction[] = this.getAccountTxs(account);
    let confirmedTxs = _.filter(allTxs, 'blockHash')
    let pendingTxs = _.filter(allTxs, (tx: Transaction) => { !tx.blockHash });

    return this.blockchain.calculateBalance(account.address, confirmedTxs, pendingTxs); // in unis
  }
}
