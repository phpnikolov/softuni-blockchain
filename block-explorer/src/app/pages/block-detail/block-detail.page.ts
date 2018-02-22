import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Block } from '../../interfaces/block';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AlertsService } from '../../services/alerts.service';

@Component({
  templateUrl: './block-detail.page.html',
  styleUrls: ['./block-detail.page.css']
})
export class BlockDetailPage implements OnInit {
  public readonly env = environment;
  private blockHash: string;
  private autoLoadingId;

  private block: Block;
  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private alerts: AlertsService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.blockHash = params.blockHash;
      this.loadBlock();
    });

    // relaod block every 5 sec
    this.autoLoadingId = setInterval(() => {
      this.loadBlock();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.autoLoadingId) {
      clearInterval(this.autoLoadingId);
    }
  }

  private loadBlock(): void {

    this.httpClient.request('GET', `${this.env.nodeUrl}/blocks/${this.blockHash}`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Block) => {
        this.block = data;
      },
      (httpErr) => {
        let errMsg = `Can't Connect to the Node (${this.env.nodeUrl}).`;
        if (httpErr.error && httpErr.error.error) {
          errMsg = httpErr.error.error;
        }

        this.block = undefined;
        this.alerts.clearAlerts();
        this.alerts.addError(errMsg);
      }
    );
  }

}
