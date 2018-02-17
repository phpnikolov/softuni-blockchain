# SoftUni Blockchain - TypeScript implementation

This project is created only for educational purposes.

## Run Node

```
cd ./node
npm install
tsc
npm start
```

## Run Miner

```
cd ./miner
npm install
tsc
npm start
```

## Run Faucet

```
cd ./faucet
npm install
tsc
npm start
```

Url: http://localhost:4220/

## Run Block Explorer

```
cd ./block-explorer
npm install
npm start
```

Url: http://localhost:4221/

## Run Wallet

```
cd ./wallet
npm install
npm start
```

Url: http://localhost:4222/

## Node API Endpoints

REST API that take care about Peers, Blocks and Transactions

Method | URI | Description
--- | --- | ---
GET | /info | Information about the Node Client (name, verssion, etc.)
POST | /blocks | Miners submit blocks here
GET | /blocks | Returns all blocks from the blockchain
GET | /blocks/:blockHash | Returns а block for specified :blockHash
GET | /transactions/ | Returns confirmed & pending transactions
GET | /transactions/confirmed | Returns confirmed transactions
GET | /transactions/pending | Returns pending transactions
POST | /transactions/pending | Adds a pending transaction
GET | /transactions/:trHash | Returns transaction for specified :trxHash
GET | /address/:address/transactions/ | Returns confirmed & pending transactions for specified :address
GET | /address/:address/transactions/confirmed | Returns confirmed transactions for specified :address
GET | /address/:address/transactions/pending | Returns pending transactions for specified :address
