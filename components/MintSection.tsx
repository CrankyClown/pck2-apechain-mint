// components/MintSection.tsx
"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { PCK2_ABI, PCK2_ADDRESS } from "../constants/pck2ABI";
import NFTReveal from "./NFTReveal";

const CONTRACT = process.env.NEXT_PUBLIC_PCK2_ADDRESS as `0x${string}`;

export default function MintSection() {
  const { address } = useAccount();
  const chainId = useChainId();

  // --- UI State ---
  const [claimIdsInput, setClaimIdsInput] = useState("");
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<{ startTokenId: bigint } | null>(null);

  // --- Contract Reads ---
  const { data: price } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "mintPrice",
  });
  const { data: saleActiveRaw } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "saleActive",
  });
  const { data: pausedRaw } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "paused",
  });
  const { data: total } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "totalSupply",
  });
  const { data: cap } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "MAX_SUPPLY",
  });
  const { data: meta } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "getMetadataConfig",
  });
  const { data: nonce } = useReadContract({
    address: CONTRACT,
    abi: PCK2_ABI,
    functionName: "claimNonce",
    args: [address ?? `0x0000000000000000000000000000000000000000`],
    query: { enabled: !!address },
  });

  // --- Boolean-safe values ---
  const saleActive = Boolean(saleActiveRaw);
  const paused = Boolean(pausedRaw);

  // --- Writes ---
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { data: receipt, isLoading: waiting } = useWaitForTransactionReceipt({ hash: txHash });

  // --- Derived values ---
  const priceEth = price ? formatEther(price as bigint) : "0";
  const mintedText = `${Number(total ?? 0n)} / ${Number(cap ?? 0n)} Minted`;

  // --- Safely destructure getMetadataConfig tuple ---
  const [baseURI, placeholder, contractMetadataURI, revealedFlag] = (meta ?? []) as [
    string,
    string,
    string,
    boolean
  ];
  const isRevealed = Boolean(revealedFlag);

  // --- Handle receipt → detect PackMinted event ---
  useEffect(() => {
    if (!receipt) return;
    try {
      const iface = new (require("ethers").utils.Interface)([
        "event PackMinted(address indexed to, uint256 startTokenId)",
      ]);
      const log = receipt.logs.find((l: any) => {
        try {
          const parsed = iface.parseLog({ topics: l.topics, data: l.data });
          return parsed?.name === "PackMinted";
        } catch {
          return false;
        }
      });
      if (log) {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        const startTokenId = BigInt(parsed.args.startTokenId.toString());
        setMintResult({ startTokenId });
      }
    } catch {
      setMintResult(null);
    }
  }, [receipt]);

  // --- Helpers ---
  const sortedTripleFromInput = (input: string): bigint[] | null => {
    const ids = input
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    const uniq = Array.from(new Set(ids));
    if (uniq.length !== 3) return null;
    uniq.sort((a, b) => a - b);
    return uniq.map((n) => BigInt(n));
  };

  const onClaim = async () => {
    if (!address) return setUiMessage("Connect wallet first.");
    const triple = sortedTripleFromInput(claimIdsInput);
    if (!triple) return setUiMessage("Enter exactly 3 unique Series 1 token IDs.");
    const expectedNonce = (nonce ?? 0n) as bigint;
    setUiMessage(null);
    writeContract({
      address: CONTRACT,
      abi: PCK2_ABI,
      functionName: "claimPackFromS1",
      args: [[triple[0], triple[1], triple[2]], expectedNonce],
    });
  };

  const onPublicMint = async () => {
    if (!address) return setUiMessage("Connect wallet first.");
    if (!saleActive || paused) return setUiMessage("Sale is not active.");
    setUiMessage(null);
    writeContract({
      address: CONTRACT,
      abi: PCK2_ABI,
      functionName: "publicMint",
      value: (price as bigint) ?? 0n,
    });
  };

  const resetMint = () => {
    setMintResult(null);
    setClaimIdsInput("");
  };

  // --- UI ---
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-white">
      <div className="flex items-center justify-between mb-10">
        <img src="/pck_logo_shadow.png" alt="PCK Logo" className="h-12 sm:h-14" />
        <div className="text-sm opacity-70">Chain ID: {chainId}</div>
      </div>

      {!mintResult && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Pop Culture Kids — Series 2 Mint
            </h1>
            <div className="opacity-80">{mintedText}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* --- Claim Pack (Series 1 Holders) --- */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur">
              <h2 className="text-xl font-semibold mb-2">
                Claim Pack (Hold 3× Series 1 NFTs)
              </h2>
              <p className="text-sm opacity-80 mb-4">
                Enter the IDs of three Series 1 tokens you own.
              </p>
              <textarea
                className="w-full h-24 p-3 rounded bg-black/40 border border-white/10"
                placeholder="e.g. 12, 77, 150"
                value={claimIdsInput}
                onChange={(e) => setClaimIdsInput(e.target.value)}
              />
              <button
                onClick={onClaim}
                disabled={isPending}
                className="mt-3 px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-40"
              >
                {isPending ? "Claiming..." : "Claim 1 Pack"}
              </button>
            </section>

            {/* --- Public Pack Mint --- */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur">
              <h2 className="text-xl font-semibold mb-2">Public Pack Mint</h2>
              <div className="text-sm opacity-80 mb-3">
                Price: {priceEth} ETH • Mints 3 NFTs
              </div>
              {!saleActive && (
                <div className="text-sm text-red-400 mb-2">Sale is not active.</div>
              )}
              {Boolean(paused) && (
                <div className="text-sm text-red-400 mb-2">Contract is paused.</div>
              )}
              <button
                onClick={onPublicMint}
                disabled={!saleActive || paused || isPending}
                className="px-5 py-2 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-semibold disabled:opacity-40"
              >
                {isPending ? "Minting..." : "Mint 1 Pack"}
              </button>
            </section>
          </div>

          {uiMessage && <div className="mt-4 text-sm text-yellow-300">{uiMessage}</div>}
          {error && (
            <div className="mt-4 text-sm text-red-400">
              {String(error.message ?? error)}
            </div>
          )}
          {waiting && (
            <div className="mt-4 text-sm text-yellow-400">
              Waiting for confirmation…
            </div>
          )}
        </>
      )}

      {/* --- Reveal Sequence --- */}
      {mintResult && (
        <NFTReveal
          tokenIds={[
            Number(mintResult.startTokenId),
            Number(mintResult.startTokenId) + 1,
            Number(mintResult.startTokenId) + 2,
          ]}
          resetMint={resetMint}
        />
      )}
    </div>
  );
}
