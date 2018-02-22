import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';


import { AppComponent } from './app.component';
import { StorageService } from './services/storage.service';
import { BlockchainService } from './services/blockchain.service';
import { CryptoService } from './services/crypto.service';
import { HttpClientModule } from '@angular/common/http';
import { AlertsComponent } from './components/alerts/alerts.component';
import { AlertsService } from './services/alerts.service';


@NgModule({
  declarations: [
    AppComponent,
    AlertsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule ,
    HttpClientModule,
    NgbModule.forRoot(),
  ],
  providers: [
    StorageService,
    AlertsService,
    BlockchainService,
    CryptoService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
