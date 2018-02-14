import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import * as elliptic from "elliptic";
import * as CryptoJS from "crypto-js";

import { StorageService } from './services/storage.service';
import { BlockchainService } from './services/blockchain.service';

import { CryptoAccount } from './interfaces/crypto-account';

import { Transaction } from './interfaces/transaction';
import { CryptoService } from './services/crypto.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public accounts: CryptoAccount[];
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
    private blockchain: BlockchainService,
    private crypto: CryptoService,
    private httpClient: HttpClient,
  ) {
    this.accounts = storage.getVal('accounts') || [];

    this.useAccount(0);
  }


  public createAccount() {

    let privateKey = this.crypto.generatePrivateKey();
    let publicKey = this.crypto.getPublicKey(privateKey);
    let address = this.crypto.getAddress(publicKey);

    let account: CryptoAccount = {
      privateKey: privateKey,
      publicKey: publicKey,
      address: address,
      name: `Account ` + (this.accounts.length + 1)
    };

    let idx = this.accounts.push(account) - 1;
    this.storage.setVal('accounts', this.accounts);
    this.useAccount(idx);
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
    alert(account.privateKey);
  }

  public renameAccount(account: CryptoAccount): void {
    let accountName = prompt("Please enter name:", account.name);
    if (accountName) {
      account.name = accountName;
    }
  }
  public deleteAccount(account: CryptoAccount): void {
    if (confirm(`Want to '${account.address}'?`)) {
      let idx = this.accounts.indexOf(account);
      if (idx > -1) {
        this.accounts.splice(idx, 1);
      }

      this.storage.setVal('accounts', this.accounts);
      this.useAccount(0);
    }
  }

  public sendTransaction(account: CryptoAccount) {
    let trx: Transaction = {
      from: account.address,
      to: this.trxRecipient,
      amount: this.trxAmount,
      timeCreated: (new Date()).getTime(),
      senderPubKey: account.publicKey
    };

    // create transaction hash
    trx.transactionHash = BlockchainService.calculateTransactionHash(trx);

    // sign transaction hash
    trx.senderSignature = this.crypto.getSignature(trx.transactionHash, account.privateKey);

    if (confirm('Confirm sending: ' + JSON.stringify(trx, null, 2))) {
      this.trxAmount = undefined;
      this.trxRecipient = undefined;

      this.httpClient.request('POST', `http://localhost:5555/transactions/pending/`, {
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

    }

  }


}
