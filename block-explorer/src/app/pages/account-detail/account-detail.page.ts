import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Transaction } from '../../interfaces/transaction';
import { HttpClient } from '@angular/common/http';
import { BlockchainService } from '../../services/blockchain.service';
import * as _ from "lodash";
import { BigInteger } from 'big-integer';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './account-detail.page.html',
  styleUrls: ['./account-detail.page.css']
})
export class AccountDetailPage implements OnInit {
  public address: string;
  private accountTransactions: Transaction[] = [];
  public readonly env = environment;

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    public blockchain: BlockchainService
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.address = params['address'];
      this.loadTransactions();
    });
  }


  private loadTransactions(): void {

    this.httpClient.request('GET', `${this.env.nodeUrl}/address/${this.address}/transactions`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Transaction[]) => {
        this.accountTransactions = data;
      });
  }

  public getBalance(): BigInteger {
    let confirmedTxs = _.filter(this.accountTransactions, 'blockHash')
    let pendingTxs = _.filter(this.accountTransactions, (tx: Transaction) => { !tx.blockHash });

    return this.blockchain.calculateBalance(this.address, confirmedTxs, pendingTxs); // in unis
  }
}
