import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from "@angular/router";


import { AppComponent } from './app.component';
import { StorageService } from './services/storage.service';
import { CryptoService } from './services/crypto.service';
import { HttpClientModule } from '@angular/common/http';

import { BlockListPage } from './pages/block-list/block-list.page';
import { BlockDetailPage } from './pages/block-detail/block-detail.page';


import { TransactionListPage } from './pages/transaction-list/transaction-list.page';
import { TransactionDetailPage } from './pages/transaction-detail/transaction-detail.page';

import { AccountDetailPage } from './pages/account-detail/account-detail.page';
import { PageNotFoundPage } from './pages/page-not-found/page-not-found.page';
import { NavbarComponent } from './components/navbar/navbar.component';
import { BlockchainService } from './services/blockchain.service';
import { AlertsComponent } from './components/alerts/alerts.component';
import { AlertsService } from './services/alerts.service';



const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'blocks',
    pathMatch: 'full'
  },
  {
    path: 'blocks',
    component: BlockListPage,
  },
  {
    path: 'blocks/:blockHash',
    children: [
      {
        path: '',
        component: BlockDetailPage,
      },
      {
        path: 'transactions',
        component: TransactionListPage
      }
    ]
  },
  {
    path: 'transactions',
    children: [
      {
        path: '',
        component: TransactionListPage,
      },
      {
        path: ':txHash',
        component: TransactionDetailPage,
      },
    ]
  },

  {
    path: 'accounts/:address',
    children: [
      {
        path: '',
        component: AccountDetailPage,

      },
      {
        path: 'transactions',
        component: TransactionListPage
      }
    ]
  },
  {
    path: '**',
    component: PageNotFoundPage
  }
];

@NgModule({
  declarations: [
    AppComponent,
    BlockDetailPage,
    BlockListPage,
    TransactionListPage,
    TransactionDetailPage,
    AccountDetailPage,
    PageNotFoundPage,
    NavbarComponent,
    AlertsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(appRoutes, { enableTracing: false }),
  ],
  providers: [
    StorageService,
    CryptoService,
    BlockchainService,
    AlertsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
