import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Alert } from "../interfaces/alert";

@Injectable()
export class AlertsService {

  private alerts: Alert[] = [];

  constructor() { }

  public getAlerts(): Alert[] {
    let alerts: Alert[] = [];

    this.alerts.forEach(alert => {
      if (!alert.is_deleted) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  private addAlert(type: string, text: string, timeout: number = 7000): void {
    let alert: Alert = {
      type: type,
      text: text,
      is_deleted: false
    };

    this.alerts.push(alert);

    if (timeout > 0) {
      setTimeout(() => {
        alert.is_deleted = true;
      }, timeout);
    }
  }

  public clearAlerts(): void {
    this.alerts.forEach(alert => {
      alert.is_deleted = true;
    });
  }

  public addError(text: string, timeout?: number): void {
    this.addAlert('danger', text, timeout);
  }

  public addMessage(text: string, timeout?: number): void {
    this.addAlert('info', text, timeout);
  }

}
