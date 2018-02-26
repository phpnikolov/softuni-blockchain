# SoftUni Blockchain - TypeScript implementation

This project is created only for educational purposes.

## Run Node

```
cd ./node
npm install
tsc
npm start
```

Url: http://localhost:5555/info

## Run Wallet

```
cd ./wallet
npm install
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

## Run Faucet

```
cd ./faucet
npm install
tsc
npm start
```

Url: http://localhost:4222/

## Run Miner

```
cd ./miner
npm install
tsc
npm start
```

## Node API Endpoints

REST API that take care about Peers, Blocks and Transactions

Method | URI | Description
--- | --- | ---
GET | /info | Information about the Node Client (name, verssion, etc.)
POST | /blocks | Miners submit blocks here
GET | /blocks | Returns all blocks from the blockchain
GET | /blocks/:blockHash | Returns а block for specified :blockHash
GET | /blocks/:blockHash/transactions | Returns transactions for specified :blockHash
GET | /transactions/ | Returns confirmed & pending transactions
GET | /transactions/:trHash | Returns transaction for specified :trHash
GET | /transactions/confirmed | Returns confirmed transactions
GET | /transactions/pending | Returns pending transactions
POST | /transactions/pending | Adds a pending transaction
GET | /address/:address/transactions/ | Returns confirmed & pending transactions for specified :address
GET | /address/:address/transactions/confirmed | Returns confirmed transactions for specified :address
GET | /address/:address/transactions/pending | Returns pending transactions for specified :address
GET | /peers | Returns peers
POST | /peers | Adds peer

## Transaction

```javascript
{
  // SHA256(from, to, amount, timeCreated)
  "transactionHash": "4dfa24415a5d61468faead56ee9034a56b0d9bbcae1385c5c6a380d7ce96acc2",
  "from": "7c2fda3a3089042b458fe85da748914ea33e2497",
  "to": "9af473410f9e407e983b680e5f8f2487098ea036",
  "amount": "1000000000000000000",
  "fee": "300000000000000",
  "senderPubKey": "0430a884e74d3a1bffdfff541a9f62b01ba40a943436cecd403748fcd287a39121a500e5a8fa20893ce5ec5ce2ec14cc94f5954401922822af5fdc60b2aef5e439",
  "senderSignature": "3045022046079685edcc35845c1c30ab6f5b0b1ba749df597de534e2595aa5389ef4036b022100e46a563bc25a22a3c3a04cf8a048a4c2b5703ad5639b5bb0b234dfc539809600",
  "timeCreated": 1519671217910,
  "blockHash": "0005245d388402d782c570c2e1dca29f62d1a8f82e14f794a67a25284efdf58b"
}
```

## Block
```javascript
{
  "prevBlockHash": "000069cf7f55554d1cc3abc96022d90408ddd8bfcd24d635806ba030f56a35a1",
  "transactions": [
    {
      // ...
    }
  ],
  "timeCreated": 1519671218836,
  "nonce": 20,
  // SHA256(prevBlockHash, trxsHashes, timeCreated, nonce)
  "blockHash": "0004e7e04fa0d427f3bd07360d0b04c2b2c797824b1fb57dc68bd3aa183e8cb1", 
  "difficulty": 49152
},
```
