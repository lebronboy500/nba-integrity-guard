import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying IntegrityVault...');

  const IntegrityVault = await ethers.getContractFactory('IntegrityVault');
  const vault = await IntegrityVault.deploy();

  await vault.deployed();

  console.log(`IntegrityVault deployed to: ${vault.address}`);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contractAddress: vault.address,
    deploymentTime: new Date().toISOString(),
  };

  console.log('Deployment Info:', deploymentInfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
