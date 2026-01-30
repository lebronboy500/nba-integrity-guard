// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * IntegrityVault - NBA Integrity Guard Smart Contract
 * Manages profit distribution from hedge trades
 */

contract IntegrityVault {
    // State variables
    address public owner;
    uint256 public totalDeposits;
    uint256 public totalProfits;

    // Distribution percentages (in basis points, 10000 = 100%)
    uint256 public constant HEDGE_PERCENTAGE = 5000; // 50%
    uint256 public constant OPS_FEE_PERCENTAGE = 500; // 5%
    uint256 public constant USER_REWARD_PERCENTAGE = 4500; // 45%

    // Mapping to track user deposits
    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public userRewards;

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event ProfitRecorded(uint256 amount, uint256 timestamp);
    event DistributionExecuted(
        uint256 hedgeAmount,
        uint256 opsAmount,
        uint256 userAmount,
        uint256 timestamp
    );
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        totalDeposits = 0;
        totalProfits = 0;
    }

    /**
     * Deposit funds into the vault
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        userDeposits[msg.sender] += msg.value;
        totalDeposits += msg.value;

        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    /**
     * Record profit from successful trades
     * Called by oracle or authorized service
     */
    function recordProfit(uint256 amount) external onlyOwner {
        require(amount > 0, "Profit amount must be greater than 0");

        totalProfits += amount;

        emit ProfitRecorded(amount, block.timestamp);
    }

    /**
     * Execute distribution of profits
     * Splits profits according to the distribution formula
     */
    function executeDistribution() external onlyOwner returns (
        uint256 hedgeAmount,
        uint256 opsAmount,
        uint256 userAmount
    ) {
        require(totalProfits > 0, "No profits to distribute");

        // Calculate distribution amounts
        hedgeAmount = (totalProfits * HEDGE_PERCENTAGE) / 10000;
        opsAmount = (totalProfits * OPS_FEE_PERCENTAGE) / 10000;
        userAmount = (totalProfits * USER_REWARD_PERCENTAGE) / 10000;

        // Verify calculation
        require(
            hedgeAmount + opsAmount + userAmount == totalProfits,
            "Distribution calculation error"
        );

        // Reset profits after distribution
        totalProfits = 0;

        emit DistributionExecuted(hedgeAmount, opsAmount, userAmount, block.timestamp);

        return (hedgeAmount, opsAmount, userAmount);
    }

    /**
     * Get distribution status
     */
    function getDistributionStatus()
        external
        view
        returns (
            uint256 deposits,
            uint256 profits,
            uint256 pendingDistribution
        )
    {
        return (totalDeposits, totalProfits, totalProfits);
    }

    /**
     * Get user deposit amount
     */
    function getUserDeposit(address user) external view returns (uint256) {
        return userDeposits[user];
    }

    /**
     * Get user reward amount
     */
    function getUserReward(address user) external view returns (uint256) {
        return userRewards[user];
    }

    /**
     * Withdraw user rewards
     */
    function withdrawRewards() external {
        uint256 reward = userRewards[msg.sender];
        require(reward > 0, "No rewards to withdraw");

        userRewards[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(msg.sender, reward, block.timestamp);
    }

    /**
     * Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    /**
     * Receive ETH
     */
    receive() external payable {
        deposit();
    }
}
