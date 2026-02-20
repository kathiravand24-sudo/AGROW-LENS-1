const hre = require("hardhat");

async function main() {
    const initialSupply = 1000000; // 1 million tokens
    const AgrowToken = await hre.ethers.getContractFactory("AgrowToken");
    const token = await AgrowToken.deploy(initialSupply);

    await token.waitForDeployment();

    console.log(`AgrowToken deployed to ${await token.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
