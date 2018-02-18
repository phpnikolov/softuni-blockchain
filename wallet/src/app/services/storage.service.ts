import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  private namespace:string;
  private settings:any = {};

  public constructor() {
    this.useNamespace('storage');
  }

  public useNamespace(namespace:string):void {
    this.namespace = namespace;
    this.loadSeeings();
  }

  public getNamespace():string {
    return this.namespace;
  }

  public getVal(key): any {
    return this.settings[this.namespace][key];
  }

  public setVal(key, value): void {
    this.settings[this.namespace][key] = value;
    this.storeSettings();
  }

  private loadSeeings() {
    let settingsJson = localStorage.getItem(this.namespace);
    let settings;
    try {
      settings = JSON.parse(settingsJson);
    } catch (ex) {
      console.error('Invalid settings JSON: ' + settingsJson)
    }

    this.settings[this.namespace] = settings || {};
  }

  private storeSettings() {
    localStorage.setItem(this.namespace, JSON.stringify(this.settings[this.namespace]));
  }

}
