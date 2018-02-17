import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Block } from '../../interfaces/block';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './block-detail.page.html',
  styleUrls: ['./block-detail.page.css']
})
export class BlockDetailPage implements OnInit {

  private block:Block;
  constructor(
    private route: ActivatedRoute,
    private httpClient:HttpClient
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadBlock(params.blockHash);
    });
  }


  private loadBlock(blockHash:string): void {

    this.httpClient.request('GET', `http://127.0.01:5555/blocks/${blockHash}`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data:Block) => {
        this.block = data;
      });
  }

}
