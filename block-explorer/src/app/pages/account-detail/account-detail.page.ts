import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Transaction } from '../../interfaces/transaction';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './account-detail.page.html',
  styleUrls: ['./account-detail.page.css']
})
export class AccountDetailPage implements OnInit {
  public address: string;
  private accountTransactions: Transaction[] = [];


  constructor(
    private route: ActivatedRoute,
    private httpClient:HttpClient
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.address = params['address'];
      this.loadTransactions();
    });
  }


  private loadTransactions(): void {

    this.httpClient.request('GET', `http://127.0.01:5555/address/${this.address}/transactions`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Transaction[]) => {
        this.accountTransactions = data;
      });
  }

  public getBalance():number {
    let balance: number = 0;

    for (let i = 0; i < this.accountTransactions.length; i++) {
      const tx = this.accountTransactions[i];
      if (tx.to == this.address && tx.blockHash) {
        // input transaction, add amount to balance (only mined transactions)
        balance += tx.amount;
      }
      else if (tx.from == this.address) {
        // outgoing transaction, subtract amount from balance
        balance -= tx.amount
      }
    }

    return balance;
  }

}
