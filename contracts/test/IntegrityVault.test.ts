import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('IntegrityVault', function () {
  let vault: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const IntegrityVault = await ethers.getContractFactory('IntegrityVault');
    vault = await IntegrityVault.deploy();
    await vault.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it('Should initialize with zero deposits and profits', async function () {
      expect(await vault.totalDeposits()).to.equal(0);
      expect(await vault.totalProfits()).to.equal(0);
    });
  });

  describe('Deposits', function () {
    it('Should accept deposits', async function () {
      const depositAmount = ethers.utils.parseEther('1.0');

      await expect(
        user1.sendTransaction({
          to: vault.address,
          value: depositAmount,
        })
      )
        .to.emit(vault, 'Deposit')
        .withArgs(user1.address, depositAmount, expect.any(Object));

      expect(await vault.getUserDeposit(user1.address)).to.equal(depositAmount);
      expect(await vault.totalDeposits()).to.equal(depositAmount);
    });

    it('Should reject zero deposits', async function () {
      await expect(
        user1.sendTransaction({
          to: vault.address,
          value: 0,
        })
      ).to.be.revertedWith('Deposit amount must be greater than 0');
    });

    it('Should accumulate multiple deposits', async function () {
      const amount1 = ethers.utils.parseEther('1.0');
      const amount2 = ethers.utils.parseEther('2.0');

      await user1.sendTransaction({ to: vault.address, value: amount1 });
      await user1.sendTransaction({ to: vault.address, value: amount2 });

      expect(await vault.getUserDeposit(user1.address)).to.equal(
        amount1.add(amount2)
      );
    });
  });

  describe('Profit Recording', function () {
    it('Should record profits', async function () {
      const profitAmount = ethers.utils.parseEther('0.5');

      await expect(vault.recordProfit(profitAmount))
        .to.emit(vault, 'ProfitRecorded')
        .withArgs(profitAmount, expect.any(Object));

      expect(await vault.totalProfits()).to.equal(profitAmount);
    });

    it('Should only allow owner to record profits', async function () {
      const profitAmount = ethers.utils.parseEther('0.5');

      await expect(
        vault.connect(user1).recordProfit(profitAmount)
      ).to.be.revertedWith('Only owner can call this function');
    });

    it('Should reject zero profit', async function () {
      await expect(vault.recordProfit(0)).to.be.revertedWith(
        'Profit amount must be greater than 0'
      );
    });
  });

  describe('Distribution', function () {
    it('Should execute distribution correctly', async function () {
      const profitAmount = ethers.utils.parseEther('1.0');

      await vault.recordProfit(profitAmount);

      const tx = await vault.executeDistribution();

      expect(await vault.totalProfits()).to.equal(0);

      await expect(tx)
        .to.emit(vault, 'DistributionExecuted')
        .withArgs(
          ethers.utils.parseEther('0.5'), // 50% hedge
          ethers.utils.parseEther('0.05'), // 5% ops
          ethers.utils.parseEther('0.45'), // 45% user
          expect.any(Object)
        );
    });

    it('Should reject distribution with no profits', async function () {
      await expect(vault.executeDistribution()).to.be.revertedWith(
        'No profits to distribute'
      );
    });

    it('Should calculate correct distribution amounts', async function () {
      const profitAmount = ethers.utils.parseEther('100.0');

      await vault.recordProfit(profitAmount);

      const [hedgeAmount, opsAmount, userAmount] =
        await vault.executeDistribution();

      expect(hedgeAmount).to.equal(ethers.utils.parseEther('50.0'));
      expect(opsAmount).to.equal(ethers.utils.parseEther('5.0'));
      expect(userAmount).to.equal(ethers.utils.parseEther('45.0'));
    });
  });

  describe('Distribution Status', function () {
    it('Should return correct distribution status', async function () {
      const depositAmount = ethers.utils.parseEther('1.0');
      const profitAmount = ethers.utils.parseEther('0.5');

      await user1.sendTransaction({ to: vault.address, value: depositAmount });
      await vault.recordProfit(profitAmount);

      const [deposits, profits, pending] =
        await vault.getDistributionStatus();

      expect(deposits).to.equal(depositAmount);
      expect(profits).to.equal(profitAmount);
      expect(pending).to.equal(profitAmount);
    });
  });

  describe('Emergency Withdrawal', function () {
    it('Should allow owner to emergency withdraw', async function () {
      const depositAmount = ethers.utils.parseEther('1.0');

      await user1.sendTransaction({ to: vault.address, value: depositAmount });

      const initialBalance = await owner.getBalance();

      const tx = await vault.emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await owner.getBalance();

      expect(finalBalance).to.be.closeTo(
        initialBalance.add(depositAmount).sub(gasUsed),
        ethers.utils.parseEther('0.01')
      );
    });

    it('Should reject emergency withdrawal by non-owner', async function () {
      await expect(vault.connect(user1).emergencyWithdraw()).to.be.revertedWith(
        'Only owner can call this function'
      );
    });
  });
});
