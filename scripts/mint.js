const { ethers } = require("hardhat");
const hre = require("hardhat");
require("dotenv").config();

const GOERLI_MARKETPLACE = "0x89D19595a157e58C49B0685C4df312BFB15488AD";
const GOERLI_MOCKERC721 = "0x88aE5806DFFB448DAb23fc9797df7550F02268fA";
const GOERLI_MOCKERC20 = "0xd5ba4Bd691Fd043d61De18F03F9E9ED3F17C447a";

// Batch mint erc721 tokens for wallet1, and erc20 tokens for wallet2
// This code is meant to be run on a local enviroment only, just for bootstrapping purposes.
async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "goerli",
    process.env.ALCHEMY_API_KEY
  );
  const wallet1 = new ethers.Wallet(process.env.GOERLI_PRIVATE_KEY, provider);
  const wallet2 = new ethers.Wallet(process.env.GOERLI_PRIVATE_KEY_2, provider);

  const MockERC721 = await ethers.getContractFactory("MockERC721");
  const mockERC721 = await MockERC721.attach(GOERLI_MOCKERC721);

  // warning: this loop can last a minute or two
  for (let i = 0; i < 10; i++) {
    const tx = await mockERC721.connect(wallet1).mint(wallet1.address, i);
    await tx.wait();
    console.log(
      `Successfully minted token: ${i} for wallet 1. Hash:${tx.hash}`
    );
  }

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.attach(GOERLI_MOCKERC20);

  const tx = await mockERC20
    .connect(wallet1)
    .mint(wallet2.address, ethers.utils.parseEther("10.0"));

  tx.wait();
  console.log(`Successfully minted 10.0 "ether" for wallet 2. Hash:${tx.hash}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
