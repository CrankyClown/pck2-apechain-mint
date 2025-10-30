export const PCK2_ADDRESS = "0x95304C0C3f700D9059f727FB77840D22086465A9";

export const PCK2_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "initialBaseURI", "type": "string" },
      { "internalType": "string", "name": "_placeholderURI", "type": "string" },
      { "internalType": "string", "name": "initialContractURI", "type": "string" },
      { "internalType": "address", "name": "_developer", "type": "address" },
      { "internalType": "address", "name": "_s1", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  // ───── ERRORS ─────────────────────────────
  { "inputs": [], "name": "ApprovalCallerNotOwnerNorApproved", "type": "error" },
  { "inputs": [], "name": "ApprovalQueryForNonexistentToken", "type": "error" },
  { "inputs": [], "name": "BalanceQueryForZeroAddress", "type": "error" },
  { "inputs": [], "name": "MintERC2309QuantityExceedsLimit", "type": "error" },
  { "inputs": [], "name": "MintToZeroAddress", "type": "error" },
  { "inputs": [], "name": "MintZeroQuantity", "type": "error" },
  { "inputs": [], "name": "NotCompatibleWithSpotMints", "type": "error" },
  { "inputs": [], "name": "OwnerQueryForNonexistentToken", "type": "error" },
  { "inputs": [], "name": "OwnershipNotInitializedForExtraData", "type": "error" },
  { "inputs": [], "name": "SequentialMintExceedsLimit", "type": "error" },
  { "inputs": [], "name": "SequentialUpToTooSmall", "type": "error" },
  { "inputs": [], "name": "SpotMintTokenIdTooSmall", "type": "error" },
  { "inputs": [], "name": "TokenAlreadyExists", "type": "error" },
  { "inputs": [], "name": "TransferCallerNotOwnerNorApproved", "type": "error" },
  { "inputs": [], "name": "TransferFromIncorrectOwner", "type": "error" },
  { "inputs": [], "name": "TransferToNonERC721ReceiverImplementer", "type": "error" },
  { "inputs": [], "name": "TransferToZeroAddress", "type": "error" },
  { "inputs": [], "name": "URIQueryForNonexistentToken", "type": "error" },

  // ───── PUBLIC STATE GETTERS ───────────────
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "s1Used",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "claimNonce",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // ───── EVENTS ─────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "approved", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "bool", "name": "active", "type": "bool" }],
    "name": "SaleActiveSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": false, "internalType": "uint256[3]", "name": "tokenIds", "type": "uint256[3]" },
      { "indexed": false, "internalType": "uint256", "name": "nonce", "type": "uint256" }
    ],
    "name": "PackClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "startTokenId", "type": "uint256" }
    ],
    "name": "PackMinted",
    "type": "event"
  },

  // ───── MAIN FUNCTIONS ─────────────────────
  {
    "inputs": [],
    "name": "publicMint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256[3]", "name": "tokenIds", "type": "uint256[3]" },
      { "internalType": "uint256", "name": "expectedNonce", "type": "uint256" }
    ],
    "name": "claimPackFromS1",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "saleActive",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "result", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reveal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
