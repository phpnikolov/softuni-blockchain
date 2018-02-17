import { Component, OnInit } from '@angular/core';
import { Block } from '../../interfaces/block';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

@Component({
  templateUrl: './block-list.page.html',
  styleUrls: ['./block-list.page.css']
})
export class BlockListPage implements OnInit {

  private blocks:Block[] = [];
  constructor(
    private httpClient:HttpClient
  ) { }

  ngOnInit() {
    this.loadBlocks();
  }


  private loadBlocks(): void {
    // get confirmed+pending
    this.httpClient.request('GET', `http://127.0.01:5555/blocks`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data: Block[]) => {
        this.blocks = _.orderBy(data, ['timeCreated'], ['desc']);;
      });
  }

}
