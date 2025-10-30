// pages/index.tsx
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useChainId,
  useSwitchChain,
  usePublicClient,
} from "wagmi";
import { formatEther, decodeEventLog } from "viem";
import { ConnectKitButton } from "connectkit";
import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { NFTReveal } from "../components/NFTReveal";
import { PCK2_ABI, PCK2_ADDRESS } from "../constants/pck2ABI";
import { contractABI as S1_ABI } from "../constants/contractABI";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const PACK_SIZE = 3;
const TARGET_CHAIN_ID = 33139; // ✅ ApeChain mainnet
const S1_ADDRESS = "0x6516f59224AeEfa810e3E37161FaA7658eE85BF3";

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { data: receipt, isLoading: waiting } = useWaitForTransactionReceipt({ hash: txHash });
  const publicClient = usePublicClient();

  // --- Contract Reads ---
  const { data: mintPrice } = useReadContract({
    abi: PCK2_ABI,
    address: PCK2_ADDRESS,
    functionName: "mintPrice",
  });

  const { data: total } = useReadContract({
    abi: PCK2_ABI,
    address: PCK2_ADDRESS,
    functionName: "totalSupply",
  });

  const [mintedTokens, setMintedTokens] = useState<number[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  // 🧩 Claim + Wallet state
  const [ownedS1, setOwnedS1] = useState<number[]>([]);
  const [eligibleS1, setEligibleS1] = useState<number[]>([]);
  const [claimedS1, setClaimedS1] = useState<number[]>([]);
  const [checkingS1, setCheckingS1] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>("");

  useEffect(() => setHasMounted(true), []);

  // --- Fetch wallet balance (auto-refresh every 10s) ---
  useEffect(() => {
    if (!address || !publicClient) return setWalletBalance("");

    const fetchBalance = async () => {
      try {
        if (!publicClient || !address) return;

        const balance = await publicClient.getBalance({ address });
        const formatted = parseFloat(formatEther(balance)).toFixed(4);

        let symbol = "ETH";
        if (chainId === 33139) symbol = "APE";
        else if (chainId === 11155111) symbol = "SepoliaETH";

        setWalletBalance(`${formatted} ${symbol}`);
      } catch (err) {
        console.warn("⚠️ Could not fetch balance:", err);
        setWalletBalance("");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address, chainId, publicClient]);

  // --- Fetch S1 ownership ---
  const fetchS1Status = useCallback(async () => {
    if (!isConnected || !address) return;
    setCheckingS1(true);

    try {
      const s1Client = createPublicClient({
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL),
      });

      const balance = await s1Client.readContract({
        abi: S1_ABI,
        address: S1_ADDRESS,
        functionName: "balanceOf",
        args: [address],
      });
      const totalOwned = Number(balance);

      if (totalOwned === 0) {
        setOwnedS1([]);
        setEligibleS1([]);
        setClaimedS1([]);
        setCheckingS1(false);
        return;
      }

      let totalSupply = 2000;
      try {
        totalSupply = Number(
          await s1Client.readContract({
            abi: S1_ABI,
            address: S1_ADDRESS,
            functionName: "totalSupply",
          })
        );
      } catch {}

      const owned: number[] = [];
      for (let id = 1; id <= totalSupply && owned.length < totalOwned; id++) {
        try {
          const owner = await s1Client.readContract({
            abi: S1_ABI,
            address: S1_ADDRESS,
            functionName: "ownerOf",
            args: [BigInt(id)],
          });
          if (owner.toLowerCase() === address.toLowerCase()) owned.push(id);
        } catch {}
      }

      const eligible: number[] = [];
      const claimed: number[] = [];
      const s2Client = createPublicClient({
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL),
      });

      for (const id of owned) {
        try {
          const used = await s2Client.readContract({
            abi: PCK2_ABI,
            address: PCK2_ADDRESS,
            functionName: "s1Used",
            args: [BigInt(id)],
          });
          if (used) claimed.push(id);
          else eligible.push(id);
        } catch {}
      }

      setOwnedS1(owned);
      setEligibleS1(eligible);
      setClaimedS1(claimed);
    } catch (err) {
      console.error("Error fetching S1 ownership:", err);
      setErrorMsg("Unable to verify S1 holdings. Try again later.");
    } finally {
      setCheckingS1(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchS1Status();
  }, [fetchS1Status]);

  // --- Parse receipt logs for PackMinted or PackClaimed events ---
  useEffect(() => {
    if (!receipt) return;

    const triggerReveal = async (newTokens: number[]) => {
      setMintedTokens(newTokens);
      setShowReveal(true);
      setMintSuccess(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      const audio = new Audio("/mint-success.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => console.log("Sound autoplay blocked"));

      await new Promise((r) => setTimeout(r, 2500));
      fetchS1Status();
    };

    (async () => {
      try {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: PCK2_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "PackMinted") {
              const startId = Number(decoded.args.startTokenId);
              const newTokens = Array.from({ length: PACK_SIZE }, (_, i) => startId + i);
              triggerReveal(newTokens);
              break;
            }

            if (decoded.eventName === "PackClaimed") {
              await new Promise((r) => setTimeout(r, 1200));
              const latestSupply = await publicClient.readContract({
                abi: PCK2_ABI,
                address: PCK2_ADDRESS,
                functionName: "totalSupply",
              });
              const lastId = Number(latestSupply);
              const newTokens = Array.from(
                { length: PACK_SIZE },
                (_, i) => lastId - PACK_SIZE + 1 + i
              );
              triggerReveal(newTokens);
              break;
            }
          } catch {}
        }
      } catch (err) {
        console.error("Receipt parse failed:", err);
      }
    })();
  }, [receipt, fetchS1Status]);

  // --- Handle Mint ---
  const handleMint = async () => {
    setErrorMsg(null);
    setMintSuccess(false);
    try {
      if (!address) throw new Error("Connect wallet first");
      if (chainId !== TARGET_CHAIN_ID) throw new Error("Wrong network. Please switch to ApeChain.");
      const valueToSend = mintPrice ? (mintPrice as bigint) : 0n;
      await writeContract({
        abi: PCK2_ABI,
        address: PCK2_ADDRESS,
        functionName: "publicMint",
        value: valueToSend,
      });
    } catch (err: any) {
      console.error("Mint failed:", err);
      setErrorMsg(err?.shortMessage || err?.message || "Mint failed");
    }
  };

  // --- Handle Claim ---
  const handleClaimPack = async () => {
    setErrorMsg(null);
    try {
      if (!address) throw new Error("Connect wallet first");
      if (chainId !== TARGET_CHAIN_ID) throw new Error("Wrong network. Please switch to ApeChain.");
      if (eligibleS1.length < 3) throw new Error("Not enough unclaimed S1 tokens (need 3).");

      const idsToUse = eligibleS1.slice(0, 3).map((n) => BigInt(n));
      const currentNonce = await publicClient?.readContract({
        abi: PCK2_ABI,
        address: PCK2_ADDRESS,
        functionName: "claimNonce",
        args: [address],
      });

      await writeContract({
        abi: PCK2_ABI,
        address: PCK2_ADDRESS,
        functionName: "claimPackFromS1",
        args: [idsToUse, currentNonce],
      });
    } catch (err: any) {
      console.error("Claim failed:", err);
      setErrorMsg(err?.shortMessage || err?.message || "Claim failed");
    }
  };

  const resetMint = async () => {
    setMintedTokens([]);
    setShowReveal(false);
    setErrorMsg(null);
    setMintSuccess(false);
    await fetchS1Status();
  };

  // --- UI ---
  return (
    <main className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/PCK2500x1042.png')" }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
          <div
            className="w-40 sm:w-44 h-16 sm:h-20 bg-contain bg-no-repeat bg-center"
            style={{ backgroundImage: "url('/PCK_logo.png')" }}
          />

          <div className="flex items-center gap-3">
            {walletBalance && (
              <div className="text-white/80 text-sm font-medium bg-white/10 border border-white/20 rounded-lg px-3 py-1">
                💰 {walletBalance}
              </div>
            )}
            <ConnectKitButton />
          </div>
        </header>

        {/* ⚠️ Chain Mismatch */}
        {isConnected && chainId !== TARGET_CHAIN_ID && (
          <div className="bg-red-900/60 text-white px-4 py-3 rounded-xl text-sm mb-4 flex flex-col items-center gap-2 border border-red-500/40">
            ⚠️ You’re on the wrong network — switch to <b>ApeChain</b> to mint.
            <button
              onClick={() => switchChain?.({ chainId: TARGET_CHAIN_ID })}
              className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-xs font-bold transition-all"
            >
              Switch to ApeChain
            </button>
          </div>
        )}

        {mintSuccess && (
          <div className="bg-green-800/70 border border-green-400/50 text-white px-5 py-3 rounded-xl text-sm text-center mb-4 animate-pulse">
            🎉 Mint successful! Revealing your NFTs...
          </div>
        )}

        {/* 🧠 S1 Claim Section */}
        {isConnected && chainId === TARGET_CHAIN_ID && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Season 1 Holders Claim</h2>
            {checkingS1 ? (
              <div className="text-white/60 text-sm">Checking eligibility...</div>
            ) : (
              <div className="text-sm text-white/70 space-y-1">
                <div>Total S1 Owned: {ownedS1.length}</div>
                <div>Used for Claims: {claimedS1.length}</div>
                <div>Eligible for Claim: {eligibleS1.length}</div>
                <div>Available Packs: {Math.floor(eligibleS1.length / 3)}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mt-4">
              <button
                onClick={handleClaimPack}
                disabled={eligibleS1.length < 3 || checkingS1}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {eligibleS1.length < 3 ? "Not Enough S1 NFTs" : "Claim Pack (S1 Holders)"}
              </button>

              <a
                href="https://www.pckmint.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-bold text-sm text-white transition-all shadow-lg"
              >
                🛒 Buy Season 1 NFTs
              </a>
            </div>
          </div>
        )}

        {/* Mint Section */}
        {!showReveal && (
          <div className="flex flex-col items-center justify-center text-center w-full">
            <div className="grid grid-cols-3 gap-4 sm:gap-6 my-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-28 sm:w-40 h-40 sm:h-52 bg-white/10 border border-white/20 rounded-2xl shadow-inner backdrop-blur-md flex items-center justify-center"
                >
                  <span className="text-4xl sm:text-5xl font-bold text-white/80">?</span>
                </div>
              ))}
            </div>

            {hasMounted && isConnected && chainId === TARGET_CHAIN_ID && (
              <>
                <button
                  onClick={handleMint}
                  disabled={isPending || waiting}
                  className="mt-4 px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 rounded-2xl text-base sm:text-lg font-bold shadow-xl transition-all disabled:opacity-40"
                >
                  {isPending || waiting ? "Minting..." : "Mint Pack"}
                </button>
                <div className="mt-3 text-sm text-white/60">
                  Price:{" "}
                  {mintPrice ? `${formatEther(mintPrice as bigint)} APE` : "Loading..."} • Mints 3 NFTs
                </div>
              </>
            )}

            {errorMsg && <div className="mt-4 text-red-400 text-sm">{errorMsg}</div>}
            {total && (
              <div className="mt-4 text-sm text-white/70">
                Total Minted: {Number(total).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {showReveal && mintedTokens.length > 0 && <NFTReveal tokenIds={mintedTokens} resetMint={resetMint} />}
      </div>
    </main>
  );
}
