import { Component, OnInit } from '@angular/core';
import { Transaction } from '../../interfaces/transaction';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';
import { BlockchainService } from '../../services/blockchain.service';


@Component({
  templateUrl: './transaction-list.page.html',
  styleUrls: ['./transaction-list.page.css']
})
export class TransactionListPage implements OnInit {
  private autoLoadingId;
  private transactions: Transaction[] = [];
  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    public blockchain: BlockchainService
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params => {

      let apiCall = 'transactions'; // all txs
      if (params.blockHash) {
        apiCall = `blocks/${params.blockHash}/transactions`; // block txs
      }
      else if (params.address) {
        apiCall = `address/${params.address}/transactions`; // address txs
      }

      this.loadTransactions(apiCall);

      // relaod transactions every 5 sec
      this.autoLoadingId = setInterval(() => {
        this.loadTransactions(apiCall);
      }, 5000);
    });
  }

  ngOnDestroy() {
    if (this.autoLoadingId) {
      clearInterval(this.autoLoadingId);
    }
  }


  private loadTransactions(apiCall: string): void {
    // get confirmed+pending
    this.httpClient.request('GET', `http://127.0.01:5555/${apiCall}`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Transaction[]) => {
        this.transactions = _.orderBy(data, ['timeCreated'], ['desc']);
      }
    );
  }

}
