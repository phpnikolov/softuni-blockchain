import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  private settings = {};

  public constructor() {
    this.loadSeeings();
  }

  public getVal(key): any {
    return this.settings[key];
  }

  public setVal(key, value): void {
    this.settings[key] = value;
    this.storeSettings();
  }

  private loadSeeings() {
    let settingsJson = localStorage.getItem('settings');
    try {
      this.settings = JSON.parse(localStorage.getItem('settings'));
    } catch (ex) {
      console.error('Invalid settings JSON: ' + settingsJson)
    }

    if (!this.settings) {
      this.settings = {};
    }
  }

  private storeSettings() {
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }

}
