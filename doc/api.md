# SkrrrtCoin - API

The SkrrrtCoin API is primary for the mining (also for the website, user-information, 
transactions and so on...) of the coin and this is a little overview over all the urls 
and their uses

## user handling

- Registration:
  - path: `/api/registration`
  - method: `post`
  - required values (json): `username` varchar(36), `email` text, `ranklist` tinyint(1)
  - respond values (json): `succeeded` tinyint(1), `name` tinyint(1), `email` tinyint(1), 
    `public_key` varchar(36), `private_key` varchar(36)
  - usage: here you can add an account to the SkrrrtCoin Database


- Check registration:
    - path: `/api/check-registration`
    - method: `get`
    - required values (json): `name` varchar(36)
    - respond values (json): `exists` tinyint(1)
    - usage: checks if the account-name already exists


- Balance:
    - path: `/api/balance`
    - method: `post`
    - required values (json): `username` varchar(36), `private_key` varchar(36)
    - respond values (json): `succeeded` tinyint(1), `skrt` int(11) ( if succeeded is
      equal to false the value `skrt` won't show up )
    - usage: fetches the current amount of coins in the wallet of the given user


- Transaction:
    - path: `/api/transaction`
    - method: `post`
    - required values (json): `sender` varchar(36) ( the senders public-key ), 
      `private_key` varchar(36), `receiver` varchar(36) ( the receivers public-key ),
      `amount` int(11), `currency` text
    - respond values (json): `succeeded` tinyint(1), `skrt` int(11) ( if succeeded is
      equal to false the value `skrt` won't show up )
    - usage: makes a transaction from wallet to wallet ( mining included )


- Blockchain:
    - path: `/api/chain`
    - method: `get`
    - required values: -
    - respond values (json): `ranklist` array
    - usage: sends the whole blockchain with a lot of information to the requester


- Value:
    - path: `/api/value/skrt`
    - method: `get`
    - required values: -
    - respond values (json): `succeeded` tinyint(1), `values` array
    - usage: sends data about how much miner where active, how many transaction
      where made and how many coins where moved added together and that from a specific
      time period

## mining

- Start Mining:
    - path: `/api/mine/start/skrt`
    - method: `get`
    - required values: -
    - respond values (json): `uuid` varchar(36), `nonce` int(11)
    - usage: sends information about the requested mining-job


- Finish Mining:
    - path: `/api/mine/finsih/skrt`
    - method: `post`
    - required values (json): `uuid` varchar(36), `solution` int(11), `wallet_key`
      varchar(36)
    - respond values: -
    - timeout: if the solution is wrong the server gives you a mining-job timeout
      of 30 seconds
    - usage: proofs the solution from the mining-job
