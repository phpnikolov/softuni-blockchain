import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Transaction } from '../../interfaces/transaction';
import { HttpClient } from '@angular/common/http';
import { BlockchainService } from '../../services/blockchain.service';
import * as _ from "lodash";
import { BigInteger } from 'big-integer';
import { environment } from '../../../environments/environment';
import { AlertsService } from '../../services/alerts.service';

@Component({
  templateUrl: './account-detail.page.html',
  styleUrls: ['./account-detail.page.css']
})
export class AccountDetailPage implements OnInit {
  public address: string;
  private autoLoadingId;
  private accountTransactions: Transaction[] = [];
  public readonly env = environment;

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    public blockchain: BlockchainService,
    private alerts: AlertsService
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.address = params['address'];
      this.loadTransactions();
    });

    // relaod account transactions every 5 sec
    this.autoLoadingId = setInterval(() => {
      this.loadTransactions();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.autoLoadingId) {
      clearInterval(this.autoLoadingId);
    }
  }


  private loadTransactions(): void {

    this.httpClient.request('GET', `${this.env.nodeUrl}/address/${this.address}/transactions`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Transaction[]) => {
        this.accountTransactions = data;
      },
      (httpErr) => {
        let errMsg = `Can't Connect to the Node (${this.env.nodeUrl}).`;
        if (httpErr.error && httpErr.error.error) {
          errMsg = httpErr.error.error;
        }

        this.accountTransactions = [];
        this.alerts.clearAlerts();
        this.alerts.addError(errMsg);
      }
    );
  }

  public getBalance(): BigInteger {
    let confirmedTxs = _.filter(this.accountTransactions, 'blockHash')
    let pendingTxs = _.filter(this.accountTransactions, (tx: Transaction) => { !tx.blockHash });

    return this.blockchain.calculateBalance(this.address, confirmedTxs, pendingTxs); // in unis
  }
}
