import React from 'react';
import { Award, TrendingUp, Users, Star, Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  totalPredictions: number;
  accuracy: number;
  totalVolume: number;
  rewardMultiplier: number;
}

const Reputation: React.FC = () => {
  const userScore = 78; // 模拟当前用户分数

  const leaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      address: '0x1234...5678',
      score: 95,
      totalPredictions: 342,
      accuracy: 87.3,
      totalVolume: 245000,
      rewardMultiplier: 1.5,
    },
    {
      rank: 2,
      address: '0x2345...6789',
      score: 92,
      totalPredictions: 289,
      accuracy: 84.1,
      totalVolume: 189000,
      rewardMultiplier: 1.5,
    },
    {
      rank: 3,
      address: '0x3456...7890',
      score: 88,
      totalPredictions: 267,
      accuracy: 82.5,
      totalVolume: 167000,
      rewardMultiplier: 1.5,
    },
    {
      rank: 4,
      address: '0x4567...8901',
      score: 82,
      totalPredictions: 198,
      accuracy: 79.2,
      totalVolume: 134000,
      rewardMultiplier: 1.2,
    },
    {
      rank: 5,
      address: '0x5678...9012',
      score: 78,
      totalPredictions: 156,
      accuracy: 75.8,
      totalVolume: 98000,
      rewardMultiplier: 1.2,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-purple-400';
    if (score >= 80) return 'text-indigo-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 60) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getBadge = (score: number) => {
    if (score >= 90) return { name: 'Oracle', color: 'purple' };
    if (score >= 80) return { name: 'Master', color: 'indigo' };
    if (score >= 70) return { name: 'Expert', color: 'blue' };
    if (score >= 60) return { name: 'Trader', color: 'green' };
    return { name: 'Novice', color: 'yellow' };
  };

  const userBadge = getBadge(userScore);

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-400">
            Reputation System
          </h1>
          <p className="text-slate-400 mt-2">
            Earn rewards based on prediction accuracy and trading volume
          </p>
        </div>

        {/* User Score Card */}
        <div className="border border-indigo-500/30 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-400">Your Reputation Score</div>
              <div className={`text-5xl font-bold ${getScoreColor(userScore)}`}>{userScore}</div>
            </div>
            <div className={`px-4 py-2 rounded-lg bg-${userBadge.color}-500/20 border border-${userBadge.color}-500/30 flex items-center gap-2`}>
              <Award size={20} className={`text-${userBadge.color}-400`} />
              <span className={`text-${userBadge.color}-400 font-semibold`}>{userBadge.name}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progress to next tier</span>
              <span>{userScore >= 80 ? 'Max Tier' : `${((userScore % 10) * 10).toFixed(0)}%`}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${userScore >= 80 ? 100 : (userScore % 10) * 10}%` }}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-slate-400">Reward Multiplier</div>
              <div className="text-xl font-bold text-green-400">
                {userScore >= 70 ? '1.5x' : '1.0x'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-slate-400">Priority Access</div>
              <div className="text-xl font-bold text-indigo-400">
                {userScore >= 70 ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-white/10 rounded-xl bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <Star size={20} />
              <span className="font-semibold">Prediction Accuracy</span>
            </div>
            <p className="text-sm text-slate-400">
              Weight: 40%<br />
              Higher accuracy = higher score
            </p>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2 text-purple-400">
              <TrendingUp size={20} />
              <span className="font-semibold">Trading Volume</span>
            </div>
            <p className="text-sm text-slate-400">
              Weight: 30%<br />
              Minimum $10k for boost
            </p>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2 text-green-400">
              <Users size={20} />
              <span className="font-semibold">Community Trust</span>
            </div>
            <p className="text-sm text-slate-400">
              Weight: 30%<br />
              Peer reviews & validations
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={24} className="text-yellow-400" />
            <h2 className="text-2xl font-semibold">Top Traders</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                  <th className="pb-3 font-semibold">Rank</th>
                  <th className="pb-3 font-semibold">Address</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Predictions</th>
                  <th className="pb-3 font-semibold">Accuracy</th>
                  <th className="pb-3 font-semibold">Volume</th>
                  <th className="pb-3 font-semibold">Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 && (
                          <Trophy
                            size={18}
                            className={
                              entry.rank === 1
                                ? 'text-yellow-400'
                                : entry.rank === 2
                                ? 'text-slate-300'
                                : 'text-orange-400'
                            }
                          />
                        )}
                        <span className="font-bold">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-sm">{entry.address}</td>
                    <td className="py-4">
                      <span className={`font-bold ${getScoreColor(entry.score)}`}>{entry.score}</span>
                    </td>
                    <td className="py-4 text-slate-300">{entry.totalPredictions}</td>
                    <td className="py-4">
                      <span className="text-green-400">{entry.accuracy}%</span>
                    </td>
                    <td className="py-4 text-slate-300">${(entry.totalVolume / 1000).toFixed(0)}k</td>
                    <td className="py-4">
                      <span className="text-purple-400 font-semibold">{entry.rewardMultiplier}x</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reputation;
