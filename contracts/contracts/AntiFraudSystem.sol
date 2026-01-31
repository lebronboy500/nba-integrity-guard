// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * AntiFraudSystem - 防作恶机制
 * 实现质押、惩罚、争议解决，防止恶意预测和操纵
 */

interface IReputationSystem {
    function getUserReputation(address user)
        external
        view
        returns (
            uint256 score,
            uint256 accuracy,
            uint256 totalPredictions,
            uint256 correctPredictions,
            uint256 totalVolume,
            bool isActive
        );
}

contract AntiFraudSystem {
    // 质押信息
    struct Stake {
        uint256 amount;           // 质押金额
        uint256 lockedUntil;      // 锁定期结束时间
        bool isLocked;            // 是否被锁定
        uint256 slashedAmount;    // 已被罚没金额
    }

    // 争议信息
    struct Dispute {
        bytes32 marketId;         // 市场ID
        address initiator;        // 发起人
        string reason;            // 争议原因
        uint256 stake;            // 争议质押
        uint256 createdAt;        // 创建时间
        uint256 votesFor;         // 支持票数
        uint256 votesAgainst;     // 反对票数
        bool isResolved;          // 是否已解决
        bool ruling;              // 裁决结果
    }

    // 投票记录
    struct Vote {
        address voter;
        bool support;             // true = 支持争议，false = 反对
        uint256 weight;           // 投票权重（基于信誉分数）
        uint256 timestamp;
    }

    // State variables
    address public owner;
    address public reputationContract;
    address public oracleContract;

    mapping(address => Stake) public stakes;
    mapping(bytes32 => Dispute) public disputes;
    mapping(bytes32 => mapping(address => Vote)) public votes;
    mapping(bytes32 => address[]) public disputeVoters;

    uint256 public totalStaked;
    uint256 public totalSlashed;
    uint256 public disputeCount;

    // 参数配置
    uint256 public constant MIN_STAKE = 100 * 10**6;        // 100 USDC最小质押
    uint256 public constant LOCK_PERIOD = 7 days;           // 7天锁定期
    uint256 public constant DISPUTE_STAKE = 50 * 10**6;     // 50 USDC争议质押
    uint256 public constant DISPUTE_PERIOD = 3 days;        // 3天争议期
    uint256 public constant SLASH_PERCENTAGE = 5000;        // 50%罚没比例
    uint256 public constant MIN_REPUTATION_TO_VOTE = 5000;  // 50分以上才能投票

    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockedUntil);
    event Unstaked(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount, string reason);

    event DisputeCreated(
        bytes32 indexed disputeId,
        bytes32 indexed marketId,
        address indexed initiator,
        string reason,
        uint256 stake
    );

    event VoteCast(
        bytes32 indexed disputeId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event DisputeResolved(
        bytes32 indexed disputeId,
        bool ruling,
        uint256 votesFor,
        uint256 votesAgainst
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier hasMinStake(address user) {
        require(stakes[user].amount >= MIN_STAKE, "Insufficient stake");
        _;
    }

    modifier canVote(address user) {
        if (reputationContract != address(0)) {
            (uint256 score, , , , , bool isActive) = IReputationSystem(
                reputationContract
            ).getUserReputation(user);
            require(
                isActive && score >= MIN_REPUTATION_TO_VOTE,
                "Insufficient reputation to vote"
            );
        }
        _;
    }

    // Constructor
    constructor(address _reputationContract) {
        owner = msg.sender;
        reputationContract = _reputationContract;
    }

    /**
     * 质押 USDC
     */
    function stake(uint256 amount) external payable {
        require(amount >= MIN_STAKE, "Below minimum stake");
        require(msg.value == amount, "Value mismatch");

        Stake storage userStake = stakes[msg.sender];
        userStake.amount += amount;
        userStake.lockedUntil = block.timestamp + LOCK_PERIOD;
        userStake.isLocked = true;

        totalStaked += amount;

        emit Staked(msg.sender, amount, userStake.lockedUntil);
    }

    /**
     * 解除质押
     */
    function unstake(uint256 amount) external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        require(
            !userStake.isLocked || block.timestamp >= userStake.lockedUntil,
            "Stake is locked"
        );

        userStake.amount -= amount;
        totalStaked -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /**
     * 罚没用户质押（因违规行为）
     */
    function slash(
        address user,
        string calldata reason
    ) external onlyOwner hasMinStake(user) returns (uint256) {
        Stake storage userStake = stakes[user];
        uint256 slashAmount = (userStake.amount * SLASH_PERCENTAGE) / 10000;

        userStake.amount -= slashAmount;
        userStake.slashedAmount += slashAmount;
        totalSlashed += slashAmount;

        emit Slashed(user, slashAmount, reason);
        return slashAmount;
    }

    /**
     * 创建争议
     */
    function createDispute(
        bytes32 marketId,
        string calldata reason
    ) external payable returns (bytes32 disputeId) {
        require(msg.value >= DISPUTE_STAKE, "Insufficient dispute stake");

        disputeId = keccak256(
            abi.encodePacked(marketId, msg.sender, block.timestamp)
        );
        require(!disputes[disputeId].isResolved, "Dispute already exists");

        disputes[disputeId] = Dispute({
            marketId: marketId,
            initiator: msg.sender,
            reason: reason,
            stake: msg.value,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            isResolved: false,
            ruling: false
        });

        disputeCount++;

        emit DisputeCreated(disputeId, marketId, msg.sender, reason, msg.value);
        return disputeId;
    }

    /**
     * 对争议投票
     */
    function voteOnDispute(
        bytes32 disputeId,
        bool support
    ) external canVote(msg.sender) {
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.isResolved, "Dispute already resolved");
        require(
            block.timestamp <= dispute.createdAt + DISPUTE_PERIOD,
            "Voting period ended"
        );
        require(
            votes[disputeId][msg.sender].voter == address(0),
            "Already voted"
        );

        // 获取投票权重（基于信誉分数）
        uint256 weight = 1;
        if (reputationContract != address(0)) {
            (uint256 score, , , , , ) = IReputationSystem(reputationContract)
                .getUserReputation(msg.sender);
            weight = score / 1000; // 每1000分 = 1票权重
            if (weight == 0) weight = 1;
        }

        votes[disputeId][msg.sender] = Vote({
            voter: msg.sender,
            support: support,
            weight: weight,
            timestamp: block.timestamp
        });

        disputeVoters[disputeId].push(msg.sender);

        if (support) {
            dispute.votesFor += weight;
        } else {
            dispute.votesAgainst += weight;
        }

        emit VoteCast(disputeId, msg.sender, support, weight);
    }

    /**
     * 解决争议
     */
    function resolveDispute(bytes32 disputeId) external returns (bool ruling) {
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.isResolved, "Already resolved");
        require(
            block.timestamp > dispute.createdAt + DISPUTE_PERIOD,
            "Voting period not ended"
        );

        // 计算裁决结果（多数投票）
        ruling = dispute.votesFor > dispute.votesAgainst;
        dispute.isResolved = true;
        dispute.ruling = ruling;

        // 退还或罚没争议质押
        if (ruling) {
            // 争议成立，退还质押 + 奖励
            uint256 reward = dispute.stake + (dispute.stake / 2);
            (bool success, ) = dispute.initiator.call{value: reward}("");
            require(success, "Reward transfer failed");
        } else {
            // 争议不成立，罚没质押
            totalSlashed += dispute.stake;
        }

        emit DisputeResolved(
            disputeId,
            ruling,
            dispute.votesFor,
            dispute.votesAgainst
        );

        return ruling;
    }

    /**
     * 检测异常交易模式
     */
    function detectFraud(
        address user,
        uint256[] calldata recentVolumes,
        uint256[] calldata recentTimestamps
    ) external view returns (bool isSuspicious, string memory reason) {
        require(
            recentVolumes.length == recentTimestamps.length,
            "Array length mismatch"
        );

        if (recentVolumes.length < 3) {
            return (false, "");
        }

        // 1. 检测短时间高频交易
        uint256 timeWindow = 300; // 5分钟
        uint256 count = 0;
        for (uint256 i = 1; i < recentTimestamps.length; i++) {
            if (recentTimestamps[i] - recentTimestamps[i - 1] < timeWindow) {
                count++;
            }
        }
        if (count > 5) {
            return (true, "High frequency trading detected");
        }

        // 2. 检测异常大额交易
        uint256 avgVolume = 0;
        for (uint256 i = 0; i < recentVolumes.length; i++) {
            avgVolume += recentVolumes[i];
        }
        avgVolume /= recentVolumes.length;

        for (uint256 i = 0; i < recentVolumes.length; i++) {
            if (recentVolumes[i] > avgVolume * 10) {
                return (true, "Abnormal volume spike detected");
            }
        }

        // 3. 检测质押不足
        if (stakes[user].amount < MIN_STAKE) {
            return (true, "Insufficient stake for trading volume");
        }

        return (false, "");
    }

    /**
     * 获取用户质押信息
     */
    function getStake(address user)
        external
        view
        returns (
            uint256 amount,
            uint256 lockedUntil,
            bool isLocked,
            uint256 slashedAmount
        )
    {
        Stake storage userStake = stakes[user];
        return (
            userStake.amount,
            userStake.lockedUntil,
            userStake.isLocked,
            userStake.slashedAmount
        );
    }

    /**
     * 获取争议信息
     */
    function getDispute(bytes32 disputeId)
        external
        view
        returns (
            bytes32 marketId,
            address initiator,
            string memory reason,
            uint256 stake,
            uint256 createdAt,
            uint256 votesFor,
            uint256 votesAgainst,
            bool isResolved,
            bool ruling
        )
    {
        Dispute storage dispute = disputes[disputeId];
        return (
            dispute.marketId,
            dispute.initiator,
            dispute.reason,
            dispute.stake,
            dispute.createdAt,
            dispute.votesFor,
            dispute.votesAgainst,
            dispute.isResolved,
            dispute.ruling
        );
    }

    /**
     * 获取争议投票情况
     */
    function getDisputeVotes(bytes32 disputeId)
        external
        view
        returns (address[] memory voters, bool[] memory supports, uint256[] memory weights)
    {
        address[] memory voterList = disputeVoters[disputeId];
        uint256 count = voterList.length;

        voters = new address[](count);
        supports = new bool[](count);
        weights = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            address voter = voterList[i];
            Vote storage vote = votes[disputeId][voter];
            voters[i] = voter;
            supports[i] = vote.support;
            weights[i] = vote.weight;
        }

        return (voters, supports, weights);
    }

    /**
     * 获取系统统计
     */
    function getSystemStats()
        external
        view
        returns (
            uint256 _totalStaked,
            uint256 _totalSlashed,
            uint256 _disputeCount,
            uint256 activeDisputes
        )
    {
        uint256 active = 0;
        // Note: 在实际生产中，应该维护一个活跃争议列表而不是遍历
        return (totalStaked, totalSlashed, disputeCount, active);
    }

    /**
     * 设置信誉合约地址
     */
    function setReputationContract(address _reputationContract)
        external
        onlyOwner
    {
        reputationContract = _reputationContract;
    }

    /**
     * 设置预言机合约地址
     */
    function setOracleContract(address _oracleContract) external onlyOwner {
        oracleContract = _oracleContract;
    }

    /**
     * 紧急提取（仅限owner）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * 转移所有权
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * 接收ETH
     */
    receive() external payable {}
}
