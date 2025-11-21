"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// Use the proxy endpoint to protect the API key
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID as string;

declare global {
  interface Window {
    solana?: any; // Phantom or compatible wallet
  }
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const connectWallet = async () => {
    try {
      if (!window.solana) {
        alert("No Solana wallet found. Please install Phantom or a compatible wallet.");
        return;
      }

      const resp = await window.solana.connect();
      setWalletAddress(resp.publicKey.toString());
      setStatus("Wallet connected.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to connect wallet.");
    }
  };

  const pingProgram = async () => {
    if (!walletAddress) {
      setStatus("Connect your wallet first.");
      return;
    }

    if (!PROGRAM_ID) {
      setStatus("Missing PROGRAM_ID env var.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Sending transaction...");
      setTxSignature(null);
      setLogs([]);

      // Construct the full proxy URL dynamically
      const rpcUrl = `${window.location.origin}/api/rpc`;
      // Disable WebSocket to use HTTP polling only (proxy doesn't support WS)
      const connection = new Connection(rpcUrl, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
        wsEndpoint: "", // Explicitly disable WebSocket
      });
      const provider = window.solana;

      const programId = new PublicKey(PROGRAM_ID);
      const userPublicKey = new PublicKey(walletAddress);

      // Build an instruction that calls your Hello World program
      const instruction = new TransactionInstruction({
        programId,
        keys: [
          {
            pubkey: userPublicKey,
            isSigner: true,
            isWritable: false,
          },
        ],
        // Your Hello World program ignores instruction data, so this can be empty
        data: Buffer.from([]),
      });

      const transaction = new Transaction().add(instruction);

      // Set fee payer and recent blockhash
      transaction.feePayer = userPublicKey;
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;

      // Ask the wallet to sign the transaction
      const signedTx = await provider.signTransaction(transaction);

      // Send to the network through Alchemy RPC
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      setTxSignature(signature);
      setStatus("Transaction sent. Waiting for confirmation...");

      // Wait for confirmation using HTTP polling (no WebSocket)
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === "confirmed" || 
            status?.value?.confirmationStatus === "finalized") {
          confirmed = true;
          break;
        }
        if (status?.value?.err) {
          throw new Error("Transaction failed");
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!confirmed) {
        throw new Error("Transaction confirmation timeout");
      }

      // Fetch transaction logs
      const txDetails = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (txDetails?.meta?.logMessages) {
        setLogs(txDetails.meta.logMessages);
      }

      setStatus("✅ Success! Your program was invoked.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error sending transaction. Check the browser console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <div className="flex justify-center mb-4">
          <Image
            src="/solanaLogoMark.png"
            alt="Solana Logo"
            width={64}
            height={64}
            priority
          />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-center">
          Solana Hello World 👋
        </h1>
        <p className="mb-4 text-sm text-slate-400 text-center">
          Connect your wallet and ping your on-chain Hello World program on{" "}
          <span className="font-semibold text-slate-100">devnet</span> using Alchemy RPC.
        </p>

        {!walletAddress ? (
          <button
            onClick={connectWallet}
            className="mb-3 w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <div className="mb-3 text-xs text-slate-400 break-all">
              Connected:{" "}
              <span className="text-slate-100">{walletAddress}</span>
            </div>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noreferrer"
              className="mb-3 block text-center text-xs text-sky-400 hover:text-sky-300 transition underline underline-offset-2"
            >
              Get Devnet Funds →
            </a>
            <button
              onClick={pingProgram}
              disabled={loading}
              className={`mb-3 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                loading
                  ? "bg-slate-600 cursor-default"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {loading ? "Sending..." : "Ping Program"}
            </button>
          </>
        )}

        {status && (
          <p className="mb-2 text-sm text-slate-200">
            {status}
          </p>
        )}

        {txSignature && (
          <p className="mb-3 text-xs text-slate-400 break-all">
            Tx Signature:{" "}
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline underline-offset-2"
            >
              View on Solana Explorer
            </a>
          </p>
        )}

        {logs.length > 0 && (
          <div className="mt-3 rounded-lg bg-slate-950/50 border border-slate-700 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-300">Program Logs:</p>
            <div className="space-y-1">
              {logs.map((log, idx) => (
                <p key={idx} className="text-xs font-mono text-emerald-400 break-all">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}