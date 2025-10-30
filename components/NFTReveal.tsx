import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface NFTRevealProps {
  tokenIds: number[];
  resetMint: () => void;
}

export const NFTReveal = ({ tokenIds, resetMint }: NFTRevealProps) => {
  const [showVideo, setShowVideo] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [revealNFTs, setRevealNFTs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // ✅ Direct IPFS image CID
  const IMAGE_CID =
    "bafybeihx2ciwvk2udpya7ulut2jci4vwtk7gnersrsu5ki7pzsqcxq6bde";

  // 🎬 Play the pack-opening animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShowVideo(false);
        setRevealNFTs(true);
      }, 600);
    }, 3000); // 3s animation duration

    return () => clearTimeout(timeout);
  }, []);

  // 🎉 Fire confetti when NFTs are revealed
  useEffect(() => {
    if (revealNFTs) {
      const duration = 5000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        confetti({
          particleCount: 40,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#ff0055", "#00ffff", "#ffff00"],
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [revealNFTs]);

  // 🌐 Build URLs directly from IPFS CIDs with fallback gateways
  useEffect(() => {
    const gateways = [
      "https://ipfs.io/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
    ];

    const buildImageUrl = (id: number) => {
      return gateways.map((gw) => `${gw}${IMAGE_CID}/${id}.png`);
    };

    const preloadImages = async () => {
      try {
        const urls: string[] = [];

        for (const id of tokenIds) {
          const imageOptions = buildImageUrl(id);

          let foundUrl = "";
          for (const url of imageOptions) {
            try {
              const res = await fetch(url, { method: "HEAD" });
              if (res.ok) {
                foundUrl = url;
                break;
              }
            } catch {
              continue;
            }
          }

          // fallback to ipfs.io if all fail
          urls.push(foundUrl || imageOptions[0]);
        }

        setImageUrls(urls);
      } catch (err) {
        console.error("❌ Failed to preload IPFS images:", err);
      } finally {
        setLoading(false);
      }
    };

    preloadImages();
  }, [tokenIds]);

  return (
    <div className="w-full max-w-5xl mx-auto text-center mt-6 sm:mt-10 px-4">
      {/* 🎞️ Opening animation */}
      {showVideo && (
        <div
          className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 transition-opacity duration-500 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <video
            autoPlay
            muted
            playsInline
            className="w-[92%] sm:w-[90%] max-w-3xl rounded-xl shadow-2xl transition-all duration-400"
            style={{ animation: "fadeIn 0.8s ease-in-out" }}
          >
            <source src="/tempvideo.mov" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* 🖼️ NFT reveal grid */}
      {revealNFTs && (
        <>
          <img
            src="/pckshadow.png"
            alt="Pop Culture Kids Logo"
            className="w-full max-w-[160px] sm:max-w-xs mx-auto mb-6 drop-shadow-lg"
          />

          {loading ? (
            <div className="text-white/70 text-lg animate-pulse">
              Loading your NFTs from IPFS...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-2 sm:px-0">
              {tokenIds.map((id, index) => (
                <div
                  key={id}
                  className="bg-gray-900/90 rounded-xl border-2 border-purple-600 hover:border-blue-400 transition-all shadow-lg"
                >
                  <div className="aspect-square bg-black rounded-t-xl p-2">
                    <img
                      src={imageUrls[index]}
                      alt={`Pop Culture Kid #${id}`}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ipfs.io/ipfs/${IMAGE_CID}/placeholder.png`;
                      }}
                    />
                  </div>
                  <div className="p-3 bg-purple-700/70 rounded-b-xl">
                    <p className="font-mono text-lg font-bold text-white tracking-wide">
                      #{id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={resetMint}
            className="mt-10 px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl hover:from-purple-700 hover:to-blue-600 text-base sm:text-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Mint Another Pack
          </button>
        </>
      )}
    </div>
  );
};

export default NFTReveal;
