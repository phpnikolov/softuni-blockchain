import { Component, OnInit } from '@angular/core';
import { Block } from '../../interfaces/block';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { environment } from '../../../environments/environment';


@Component({
  templateUrl: './block-list.page.html',
  styleUrls: ['./block-list.page.css']
})
export class BlockListPage implements OnInit {
  private autoLoadingId;
  public readonly env = environment;
  private blocks:Block[] = [];
  constructor(
    private httpClient:HttpClient
  ) { }

  ngOnInit() {
    this.loadBlocks();

    // relaod blocks every 5 sec
    this.autoLoadingId = setInterval(() => {
      this.loadBlocks();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.autoLoadingId) {
      clearInterval(this.autoLoadingId);
    }
  }


  private loadBlocks(): void {
    // get confirmed+pending
    this.httpClient.request('GET', `${this.env.nodeUrl}/blocks`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Block[]) => {
        this.blocks = _.orderBy(data, ['timeCreated'], ['desc']);;
      });
  }

}
