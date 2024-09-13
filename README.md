After cloning the repository, run ```npm install``` to download the libraries.
The second step is to initialize the environment file with your wallet address and private key using the following command:
```
echo "PRIVATE_KEY='YOUR_PRIVATE_KEY'
ADDRESS='YOUR_WALLET_ADDRESS'" >> .env
```

Note: You can use multiple wallets by updating your .env file with PRIVATE_KEY1, PRIVATE_KEY2, ... and ADDRESS1, ADDRESS2, ...; and don't forget to add them to the wallets constants in main.js
