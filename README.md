# Solana Hello World App

![Solana Hello World Screenshot](https://alchemyapi-res.cloudinary.com/image/upload/v1763746952/Screenshot_2025-11-21_at_9.42.27_AM_efycbi.png)


This is a minimal Next.js demo DApp for interacting with a Solana on-chain "Hello World" program using the Phantom wallet and the Alchemy RPC proxy. Users can connect their Solana wallet (e.g., Phantom), send a simple "ping" transaction to their deployed Solana program on **devnet**, and view the transaction signature and program logs directly in the app UI. 

**Features:**
- Connect to your Solana wallet (Phantom or compatible)
- Send a transaction to your Hello World program on Solana devnet
- View transaction signature and link to Solana Explorer
- See logs output by your program
- All RPC requests are securely proxied via a Next.js API route to protect your Alchemy API key

_Note:_ This app is meant for demo/educational purposes and uses client-side wallet connections only. See the source code for details on how transactions are built and sent with `@solana/web3.js` and how the Alchemy API proxy is implemented.