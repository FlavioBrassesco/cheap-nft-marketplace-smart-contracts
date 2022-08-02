const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Marketplace", function () {
  async function deployMarketplace() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();

    return { marketplace, owner, otherAccount };
  }

  async function deployERC721() {
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const mockERC721 = await MockERC721.deploy("MockERC721", "M721");

    const tx = await mockERC721.mint(owner.address, 0);
    tx.wait();

    return { mockERC721 };
  }

  async function deployERC20() {
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy("MockERC20", "M20");

    const tx = await mockERC20.mint(
      otherAccount.address,
      ethers.utils.parseEther("2.0")
    );
    tx.wait();

    return { mockERC20 };
  }

  it("transaction should complete with both signatures", async () => {
    const { marketplace, owner, otherAccount } = await loadFixture(
      deployMarketplace
    );
    const { mockERC20 } = await loadFixture(deployERC20);
    const { mockERC721 } = await loadFixture(deployERC721);

    const txapprove = await mockERC20
      .connect(otherAccount)
      .approve(marketplace.address, ethers.utils.parseEther("1.0"));
    txapprove.wait();

    const txapproval = await mockERC721
      .connect(owner)
      .setApprovalForAll(marketplace.address, true);
    txapproval.wait();

    const AuctionData = {
      collectionAddress: mockERC721.address,
      erc20Address: mockERC20.address,
      tokenId: 0,
      bid: ethers.utils.parseEther("1.0"),
    };

    const messageHash = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256"],
      [
        AuctionData.collectionAddress,
        AuctionData.erc20Address,
        AuctionData.tokenId,
        AuctionData.bid,
      ]
    );

    const bidderSignature = await otherAccount.signMessage(
      ethers.utils.arrayify(messageHash)
    );

    const hashedBidderSig = ethers.utils.solidityKeccak256(
      ["bytes"],
      [bidderSignature]
    );
    const ownerSignature = await owner.signMessage(
      ethers.utils.arrayify(hashedBidderSig)
    );

    const tx = await marketplace.connect(otherAccount).finishAuction(
      AuctionData,
      bidderSignature,
      ownerSignature
    );
    tx.wait();

    expect(await mockERC721.ownerOf(0)).to.equal(otherAccount.address);
    expect(await mockERC20.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("1.0")
    );
  });
});
