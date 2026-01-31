import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ReputationSystem } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('ReputationSystem', function () {
  let reputationSystem: ReputationSystem;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ReputationSystemFactory = await ethers.getContractFactory('ReputationSystem');
    reputationSystem = await ReputationSystemFactory.deploy();
    await reputationSystem.waitForDeployment();
  });

  describe('Prediction Recording', function () {
    it('Should record a new prediction', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6); // 100 USDC

      await expect(
        reputationSystem.recordPrediction(
          predictionId,
          user1.address,
          marketId,
          true, // YES outcome
          amount
        )
      )
        .to.emit(reputationSystem, 'PredictionRecorded')
        .withArgs(user1.address, predictionId, marketId, true, amount, (await ethers.provider.getBlock('latest'))!.timestamp + 1);

      // Check user reputation initialized
      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.totalPredictions).to.equal(1);
      expect(rep.isActive).to.be.true;
    });

    it('Should reject duplicate prediction IDs', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6);

      await reputationSystem.recordPrediction(
        predictionId,
        user1.address,
        marketId,
        true,
        amount
      );

      // Settle the prediction first
      await reputationSystem.settlePrediction(predictionId, true);

      // Try to record again with same ID
      await expect(
        reputationSystem.recordPrediction(
          predictionId,
          user1.address,
          marketId,
          false,
          amount
        )
      ).to.be.revertedWith('Already exists');
    });

    it('Should reject zero amount predictions', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');

      await expect(
        reputationSystem.recordPrediction(
          predictionId,
          user1.address,
          marketId,
          true,
          0
        )
      ).to.be.revertedWith('Amount must be > 0');
    });
  });

  describe('Prediction Settlement', function () {
    it('Should settle correct prediction and update reputation', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6);

      await reputationSystem.recordPrediction(
        predictionId,
        user1.address,
        marketId,
        true, // User predicts YES
        amount
      );

      await expect(
        reputationSystem.settlePrediction(predictionId, true) // Actual outcome: YES
      )
        .to.emit(reputationSystem, 'PredictionSettled')
        .withArgs(predictionId, user1.address, true, amount);

      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.correctPredictions).to.equal(1);
      expect(rep.totalPredictions).to.equal(1);
      expect(rep.accuracy).to.equal(10000); // 100%
    });

    it('Should settle incorrect prediction', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6);

      await reputationSystem.recordPrediction(
        predictionId,
        user1.address,
        marketId,
        true, // User predicts YES
        amount
      );

      await reputationSystem.settlePrediction(predictionId, false); // Actual outcome: NO

      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.correctPredictions).to.equal(0);
      expect(rep.totalPredictions).to.equal(1);
      expect(rep.accuracy).to.equal(0);
    });

    it('Should reject settling already settled prediction', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6);

      await reputationSystem.recordPrediction(
        predictionId,
        user1.address,
        marketId,
        true,
        amount
      );

      await reputationSystem.settlePrediction(predictionId, true);

      await expect(
        reputationSystem.settlePrediction(predictionId, true)
      ).to.be.revertedWith('Already settled');
    });
  });

  describe('Reputation Scoring', function () {
    it('Should calculate reputation score correctly', async function () {
      // Record 10 predictions, 7 correct
      for (let i = 0; i < 10; i++) {
        const predictionId = ethers.id(`PRED_${i}`);
        const marketId = ethers.id('MARKET_001');
        const amount = ethers.parseUnits('100', 6);

        await reputationSystem.recordPrediction(
          predictionId,
          user1.address,
          marketId,
          true,
          amount
        );

        const outcome = i < 7; // First 7 are correct
        await reputationSystem.settlePrediction(predictionId, outcome);
      }

      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.correctPredictions).to.equal(7);
      expect(rep.totalPredictions).to.equal(10);

      // Accuracy score: 70% * 6000 = 4200
      const accuracyScore = (7 * 6000) / 10;
      expect(rep.reputationScore).to.be.gte(accuracyScore);
    });

    it('Should give bonus reward for high reputation', async function () {
      // Create high reputation user (8/10 correct)
      for (let i = 0; i < 10; i++) {
        const predictionId = ethers.id(`PRED_${i}`);
        const marketId = ethers.id('MARKET_001');
        const amount = ethers.parseUnits('1000', 6); // $1000 for volume score

        await reputationSystem.recordPrediction(
          predictionId,
          user1.address,
          marketId,
          true,
          amount
        );

        const outcome = i < 8;
        await reputationSystem.settlePrediction(predictionId, outcome);
      }

      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.reputationScore).to.be.gte(7000); // Should be > 70 points

      // Next prediction should get 1.5x reward
      const nextPredId = ethers.id('PRED_BONUS');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6);

      await reputationSystem.recordPrediction(
        nextPredId,
        user1.address,
        marketId,
        true,
        amount
      );

      const tx = await reputationSystem.settlePrediction(nextPredId, true);
      const receipt = await tx.wait();

      // Check reward is 1.5x
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = reputationSystem.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });
          return parsed?.name === 'PredictionSettled';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = reputationSystem.interface.parseLog({
          topics: [...event.topics],
          data: event.data
        });
        const rewardAmount = parsed?.args.rewardAmount;
        const expectedReward = (amount * 150n) / 100n; // 1.5x
        expect(rewardAmount).to.equal(expectedReward);
      }
    });
  });

  describe('Leaderboard', function () {
    it('Should return top users', async function () {
      const users = [user1, user2];

      // Create predictions for both users
      for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < 5; j++) {
          const predictionId = ethers.id(`PRED_${i}_${j}`);
          const marketId = ethers.id('MARKET_001');
          const amount = ethers.parseUnits('100', 6);

          await reputationSystem.recordPrediction(
            predictionId,
            users[i].address,
            marketId,
            true,
            amount
          );

          // user1: 4/5 correct, user2: 3/5 correct
          const outcome = j < (i === 0 ? 4 : 3);
          await reputationSystem.settlePrediction(predictionId, outcome);
        }
      }

      const [topUsers, topScores] = await reputationSystem.getLeaderboard(2);

      expect(topUsers[0]).to.equal(user1.address);
      expect(topUsers[1]).to.equal(user2.address);
      expect(topScores[0]).to.be.gt(topScores[1]);
    });
  });

  describe('System Stats', function () {
    it('Should return correct system statistics', async function () {
      // Record some predictions
      for (let i = 0; i < 3; i++) {
        const predictionId = ethers.id(`PRED_${i}`);
        const marketId = ethers.id('MARKET_001');
        const amount = ethers.parseUnits('100', 6);

        await reputationSystem.recordPrediction(
          predictionId,
          user1.address,
          marketId,
          true,
          amount
        );

        await reputationSystem.settlePrediction(predictionId, true);
      }

      const stats = await reputationSystem.getSystemStats();
      expect(stats._totalUsers).to.equal(1);
      expect(stats._totalPredictions).to.equal(3);
      expect(stats._activeUserCount).to.equal(1);
    });
  });

  describe('User Suspension', function () {
    it('Should allow owner to suspend users', async function () {
      const predictionId = ethers.id('PRED_001');
      const marketId = ethers.id('MARKET_001');
      const amount = ethers.parseUnits('100', 6);

      await reputationSystem.recordPrediction(
        predictionId,
        user1.address,
        marketId,
        true,
        amount
      );

      await reputationSystem.suspendUser(user1.address);

      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.isActive).to.be.false;
    });

    it('Should allow owner to unsuspend users', async function () {
      await reputationSystem.suspendUser(user1.address);
      await reputationSystem.unsuspendUser(user1.address);

      const rep = await reputationSystem.getUserReputation(user1.address);
      expect(rep.isActive).to.be.true;
    });
  });
});
