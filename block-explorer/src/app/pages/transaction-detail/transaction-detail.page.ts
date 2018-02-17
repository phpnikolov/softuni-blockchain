import { Component, OnInit } from '@angular/core';
import { Transaction } from '../../interfaces/transaction';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './transaction-detail.page.html',
  styleUrls: ['./transaction-detail.page.css']
})
export class TransactionDetailPage implements OnInit {


  private transaction:Transaction;
  constructor(
    private route: ActivatedRoute,
    private httpClient:HttpClient
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadTransaction(params.txHash);
    });
    
  }


  private loadTransaction(transactionHash:string): void {

    this.httpClient.request('GET', `http://127.0.01:5555/transactions/${transactionHash}`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data:Transaction) => {
        this.transaction = data;
      });
  }
}
