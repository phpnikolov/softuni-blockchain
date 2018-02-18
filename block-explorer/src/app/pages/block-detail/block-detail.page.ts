import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Block } from '../../interfaces/block';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './block-detail.page.html',
  styleUrls: ['./block-detail.page.css']
})
export class BlockDetailPage implements OnInit {
  public readonly env = environment;

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

    this.httpClient.request('GET', `${this.env.nodeUrl}/blocks/${blockHash}`, {
      observe: 'body',
      responseType: 'json'
    }).subscribe(
      (data:Block) => {
        this.block = data;
      });
  }

}
