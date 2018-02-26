import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertsService } from '../../services/alerts.service';

import { environment } from '../../../environments/environment';
import { NodeInfo } from '../../interfaces/node-info';
import { BlockchainService } from '../../services/blockchain.service';

@Component({
  templateUrl: './node-info.page.html',
  styleUrls: ['./node-info.page.css']
})
export class NodeInfoPage implements OnInit {

  private env = environment;
  private nodeUrl: string = this.env.nodeUrl;
  public nodeInfo: NodeInfo;
  public peers: string[] = [];
  private autoLoadingId;

  constructor(
    public blockchain: BlockchainService,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private alerts: AlertsService
  ) { }

  ngOnInit() {
    this.loadNodeInfo();
    this.loadPeers();

    // relaod transactions every 5 sec
    this.autoLoadingId = setInterval(() => {
      this.loadNodeInfo();
      this.loadPeers();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.autoLoadingId) {
      clearInterval(this.autoLoadingId);
    }
  }

  private loadNodeInfo(): void {

    this.httpClient.request('GET', `${this.env.nodeUrl}/info`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: NodeInfo) => {
        this.nodeInfo = data;
      },
      (httpErr) => {
        let errMsg = `Can't Connect to the Node (${this.env.nodeUrl}).`;
        if (httpErr.error && httpErr.error.error) {
          errMsg = httpErr.error.error;
        }

        this.nodeInfo = undefined;
        this.alerts.clearAlerts();
        this.alerts.addError(errMsg);
      });
  }

  private loadPeers(): void {

    this.httpClient.request('GET', `${this.env.nodeUrl}/peers`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (peers: string[]) => {
        this.peers = peers;
      },
      (httpErr) => {
        let errMsg = `Can't Connect to the Node (${this.env.nodeUrl}).`;
        if (httpErr.error && httpErr.error.error) {
          errMsg = httpErr.error.error;
        }

        this.peers = [];
        this.alerts.clearAlerts();
        this.alerts.addError(errMsg);
      });
  }

  private changeNode(url: string) {
    this.env.nodeUrl = url;
    this.loadNodeInfo();
    this.loadPeers();
  }


}
