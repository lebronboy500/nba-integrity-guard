// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ReputationSystem - 用户信誉评分系统
 * 追踪预测准确率、交易量、激励用户正确预测
 */

contract ReputationSystem {
    // 用户信誉数据
    struct UserReputation {
        uint256 totalPredictions;      // 总预测次数
        uint256 correctPredictions;    // 正确预测次数
        uint256 totalVolume;           // 总交易量（USDC）
        uint256 reputationScore;       // 信誉评分（0-10000）
        uint256 lastUpdateTime;        // 最后更新时间
        bool isActive;                 // 是否活跃
    }

    // 预测记录
    struct Prediction {
        address user;
        bytes32 marketId;
        bool outcome;                  // 预测结果（YES/NO）
        uint256 amount;                // 下注金额
        uint256 timestamp;
        bool isSettled;                // 是否已结算
        bool isCorrect;                // 是否正确（仅结算后有效）
    }

    // State variables
    address public owner;
    mapping(address => UserReputation) public reputations;
    mapping(bytes32 => Prediction) public predictions;

    address[] public activeUsers;
    uint256 public totalUsers;
    uint256 public totalPredictions;

    // 评分权重（basis points，10000 = 100%）
    uint256 public constant ACCURACY_WEIGHT = 6000;     // 60%
    uint256 public constant VOLUME_WEIGHT = 2000;       // 20%
    uint256 public constant ACTIVITY_WEIGHT = 2000;     // 20%

    // 奖励参数
    uint256 public constant MIN_SCORE_FOR_BONUS = 7000; // 70分以上有奖励
    uint256 public constant BONUS_MULTIPLIER = 150;     // 1.5x奖励

    // Events
    event PredictionRecorded(
        address indexed user,
        bytes32 indexed predictionId,
        bytes32 indexed marketId,
        bool outcome,
        uint256 amount,
        uint256 timestamp
    );

    event PredictionSettled(
        bytes32 indexed predictionId,
        address indexed user,
        bool isCorrect,
        uint256 rewardAmount
    );

    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        uint256 accuracy,
        uint256 volume
    );

    event BonusRewarded(
        address indexed user,
        uint256 amount,
        uint256 reputationScore
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    /**
     * 记录新的预测
     */
    function recordPrediction(
        bytes32 predictionId,
        address user,
        bytes32 marketId,
        bool outcome,
        uint256 amount
    ) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(!predictions[predictionId].isSettled, "Already exists");

        // 如果是新用户，初始化
        if (!reputations[user].isActive) {
            reputations[user].isActive = true;
            activeUsers.push(user);
            totalUsers++;
        }

        // 记录预测
        predictions[predictionId] = Prediction({
            user: user,
            marketId: marketId,
            outcome: outcome,
            amount: amount,
            timestamp: block.timestamp,
            isSettled: false,
            isCorrect: false
        });

        reputations[user].totalPredictions++;
        totalPredictions++;

        emit PredictionRecorded(
            user,
            predictionId,
            marketId,
            outcome,
            amount,
            block.timestamp
        );
    }

    /**
     * 结算预测（由 Oracle 调用）
     */
    function settlePrediction(
        bytes32 predictionId,
        bool actualOutcome
    ) external onlyOwner returns (uint256 rewardAmount) {
        Prediction storage prediction = predictions[predictionId];
        require(!prediction.isSettled, "Already settled");
        require(prediction.amount > 0, "Prediction not found");

        address user = prediction.user;
        bool isCorrect = prediction.outcome == actualOutcome;

        // 更新预测记录
        prediction.isSettled = true;
        prediction.isCorrect = isCorrect;

        // 更新用户统计
        UserReputation storage rep = reputations[user];
        if (isCorrect) {
            rep.correctPredictions++;
        }
        rep.totalVolume += prediction.amount;
        rep.lastUpdateTime = block.timestamp;

        // 重新计算信誉分数
        uint256 newScore = calculateReputationScore(user);
        rep.reputationScore = newScore;

        // 计算奖励
        rewardAmount = calculateReward(user, prediction.amount, isCorrect);

        emit PredictionSettled(predictionId, user, isCorrect, rewardAmount);
        emit ReputationUpdated(
            user,
            newScore,
            getAccuracy(user),
            rep.totalVolume
        );

        return rewardAmount;
    }

    /**
     * 计算信誉分数（0-10000）
     */
    function calculateReputationScore(address user)
        public
        view
        returns (uint256)
    {
        UserReputation storage rep = reputations[user];
        if (rep.totalPredictions == 0) {
            return 5000; // 新用户默认50分
        }

        // 1. 准确率得分（0-6000）
        uint256 accuracyScore = (rep.correctPredictions * ACCURACY_WEIGHT) /
            rep.totalPredictions;

        // 2. 交易量得分（0-2000）
        // 使用 log scale：每 1000 USDC 增加分数
        uint256 volumeScore = 0;
        if (rep.totalVolume > 0) {
            uint256 volumeInThousands = rep.totalVolume / 1000;
            volumeScore = volumeInThousands > 10
                ? VOLUME_WEIGHT
                : (volumeInThousands * VOLUME_WEIGHT) / 10;
        }

        // 3. 活跃度得分（0-2000）
        // 基于最近活跃时间
        uint256 activityScore = 0;
        if (rep.lastUpdateTime > 0) {
            uint256 daysSinceActive = (block.timestamp - rep.lastUpdateTime) /
                1 days;
            if (daysSinceActive < 7) {
                activityScore = ACTIVITY_WEIGHT;
            } else if (daysSinceActive < 30) {
                activityScore = ACTIVITY_WEIGHT / 2;
            }
        }

        return accuracyScore + volumeScore + activityScore;
    }

    /**
     * 计算奖励金额
     */
    function calculateReward(
        address user,
        uint256 baseAmount,
        bool isCorrect
    ) public view returns (uint256) {
        if (!isCorrect) {
            return 0; // 错误预测无奖励
        }

        UserReputation storage rep = reputations[user];
        uint256 score = rep.reputationScore;

        // 高分用户获得额外奖励
        if (score >= MIN_SCORE_FOR_BONUS) {
            return (baseAmount * BONUS_MULTIPLIER) / 100;
        }

        return baseAmount; // 基础奖励
    }

    /**
     * 获取用户准确率（basis points）
     */
    function getAccuracy(address user) public view returns (uint256) {
        UserReputation storage rep = reputations[user];
        if (rep.totalPredictions == 0) {
            return 0;
        }
        return (rep.correctPredictions * 10000) / rep.totalPredictions;
    }

    /**
     * 获取用户信誉详情
     */
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
        )
    {
        UserReputation storage rep = reputations[user];
        return (
            rep.reputationScore,
            getAccuracy(user),
            rep.totalPredictions,
            rep.correctPredictions,
            rep.totalVolume,
            rep.isActive
        );
    }

    /**
     * 获取预测详情
     */
    function getPrediction(bytes32 predictionId)
        external
        view
        returns (
            address user,
            bytes32 marketId,
            bool outcome,
            uint256 amount,
            uint256 timestamp,
            bool isSettled,
            bool isCorrect
        )
    {
        Prediction storage pred = predictions[predictionId];
        return (
            pred.user,
            pred.marketId,
            pred.outcome,
            pred.amount,
            pred.timestamp,
            pred.isSettled,
            pred.isCorrect
        );
    }

    /**
     * 获取排行榜（前N名高分用户）
     */
    function getLeaderboard(uint256 limit)
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        require(limit > 0 && limit <= 100, "Invalid limit");

        uint256 count = limit > activeUsers.length ? activeUsers.length : limit;
        address[] memory topUsers = new address[](count);
        uint256[] memory topScores = new uint256[](count);

        // 简单的选择排序（链上gas较贵，实际应该链下排序）
        for (uint256 i = 0; i < count; i++) {
            uint256 maxScore = 0;
            address maxUser = address(0);
            uint256 maxIndex = 0;

            for (uint256 j = 0; j < activeUsers.length; j++) {
                address user = activeUsers[j];
                uint256 score = reputations[user].reputationScore;

                // 检查是否已经在排行榜中
                bool alreadySelected = false;
                for (uint256 k = 0; k < i; k++) {
                    if (topUsers[k] == user) {
                        alreadySelected = true;
                        break;
                    }
                }

                if (!alreadySelected && score > maxScore) {
                    maxScore = score;
                    maxUser = user;
                    maxIndex = j;
                }
            }

            if (maxUser != address(0)) {
                topUsers[i] = maxUser;
                topScores[i] = maxScore;
            }
        }

        return (topUsers, topScores);
    }

    /**
     * 批量结算预测
     */
    function settlePredictionBatch(
        bytes32[] calldata predictionIds,
        bool[] calldata actualOutcomes
    ) external onlyOwner {
        require(
            predictionIds.length == actualOutcomes.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (!predictions[predictionIds[i]].isSettled) {
                settlePrediction(predictionIds[i], actualOutcomes[i]);
            }
        }
    }

    /**
     * 获取系统统计
     */
    function getSystemStats()
        external
        view
        returns (
            uint256 _totalUsers,
            uint256 _totalPredictions,
            uint256 _activeUserCount,
            uint256 averageScore
        )
    {
        uint256 totalScore = 0;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < activeUsers.length; i++) {
            UserReputation storage rep = reputations[activeUsers[i]];
            if (rep.isActive) {
                totalScore += rep.reputationScore;
                activeCount++;
            }
        }

        uint256 avgScore = activeCount > 0 ? totalScore / activeCount : 0;

        return (totalUsers, totalPredictions, activeCount, avgScore);
    }

    /**
     * 紧急暂停用户（防作恶）
     */
    function suspendUser(address user) external onlyOwner {
        reputations[user].isActive = false;
        emit ReputationUpdated(user, 0, 0, 0);
    }

    /**
     * 恢复用户
     */
    function unsuspendUser(address user) external onlyOwner {
        reputations[user].isActive = true;
        uint256 score = calculateReputationScore(user);
        emit ReputationUpdated(
            user,
            score,
            getAccuracy(user),
            reputations[user].totalVolume
        );
    }

    /**
     * 转移所有权
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
