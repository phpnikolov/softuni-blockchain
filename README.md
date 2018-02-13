# SoftUni Blockchain - TypeScript implementation

This project is created only for educational purposes.

## Node API Endpoints

REST API that take care about Peers, Blocks and Transactions

Method | URI | Description
--- | --- | ---
GET | /info | Information about the Node Client (name, verssion, etc.)
POST | /blocks | Miners submit blocks here
GET | /blocks | Returns all blocks from the blockchain
GET | /blocks/:blockHash | Returns а block for specified :blockHash
GET | /transactions/confirmed | Returns confirmed transactions
GET | /transactions/confirmed/:transactionHash | Returns confirmed transaction for specified :hash
POST | /transactions/pending | Adds a pending transaction
GET | /transactions/pending | Returns pending transactions
GET | /address/:address/transactions/confirmed | Returns confirmed transactions for specified :address
GET | /address/:address/transactions/pending | Returns pending transactions for specified :address