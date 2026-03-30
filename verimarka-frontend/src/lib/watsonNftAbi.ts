export const watsonNftAbi = [
  {
    type: "function",
    name: "voteForDocument",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "isOriginal", type: "bool" },
    ],
    outputs: [],
  },
] as const;
