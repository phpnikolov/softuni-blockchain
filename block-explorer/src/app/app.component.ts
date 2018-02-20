import { Component } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private env = environment;

  public changeNode() {
    let url = prompt('Node URL:', this.env.nodeUrl);
    if (url) {
      this.env.nodeUrl = url;
    }
  }
}
