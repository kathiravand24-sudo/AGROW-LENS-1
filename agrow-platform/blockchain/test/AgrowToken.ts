import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgrowToken", function () {
    it("Should have correct name and symbol", async function () {
        const AgrowToken = await ethers.getContractFactory("AgrowToken");
        const token = await AgrowToken.deploy(1000);
        await token.waitForDeployment();

        expect(await token.name()).to.equal("AgrowToken");
        expect(await token.symbol()).to.equal("AGROW");
    });

    it("Should mint initial supply to owner", async function () {
        const [owner] = await ethers.getSigners();
        const AgrowToken = await ethers.getContractFactory("AgrowToken");
        const token = await AgrowToken.deploy(1000);
        await token.waitForDeployment();

        const balance = await token.balanceOf(owner.address);
        // 1000 * 10^18
        expect(balance).to.equal(ethers.parseUnits("1000", 18));
    });
});
