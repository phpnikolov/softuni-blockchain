import { Component, OnInit } from '@angular/core';
import { Alert } from "../../interfaces/alert";
import { AlertsService } from "../../services/alerts.service";

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {

  constructor(public alerts:AlertsService) { }

  ngOnInit() {
  }

}
