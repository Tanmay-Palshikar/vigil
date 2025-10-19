import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockRiskData } from '../mock-data';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedRisk, setSelectedRisk] = useState(null);

  const getRiskLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getRiskCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'reputational': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'security': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'compliance': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-0 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-cyan-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Full Screen Layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Header */}
        <div className="flex-shrink-0 p-6">
          <div className="glass-card p-8 rounded-3xl backdrop-blur-xl bg-white/15 border border-white/30 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <h1 className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient-flow">
                    VIGIL
                  </h1>
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-full blur-lg opacity-50"></div>
                </div>
                <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                <div>
                  <p className="text-2xl font-bold text-white">Command Center</p>
                  <p className="text-slate-300 text-lg">
                    Welcome back, {user?.name || user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-sm font-medium">System Online</span>
                </div>
                <button
                  onClick={logout}
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 text-red-200 hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-400/50 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card-small p-8 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="text-5xl font-black text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                    {mockRiskData.length}
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="text-slate-300 text-lg font-semibold">Total Risks</div>
                <div className="text-slate-400 text-sm mt-1">Active monitoring</div>
              </div>
            </div>
            <div className="glass-card-small p-8 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="text-5xl font-black text-red-400 group-hover:scale-110 transition-transform duration-300">
                    {mockRiskData.filter(risk => risk.aiAnalysis.riskLevel === 'High').length}
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-red-400/10 to-pink-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="text-slate-300 text-lg font-semibold">High Risk</div>
                <div className="text-slate-400 text-sm mt-1">Immediate attention</div>
              </div>
            </div>
            <div className="glass-card-small p-8 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="text-5xl font-black text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                    {mockRiskData.filter(risk => risk.aiAnalysis.riskLevel === 'Medium').length}
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="text-slate-300 text-lg font-semibold">Medium Risk</div>
                <div className="text-slate-400 text-sm mt-1">Monitor closely</div>
              </div>
            </div>
            <div className="glass-card-small p-8 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="text-5xl font-black text-green-400 group-hover:scale-110 transition-transform duration-300">
                    {mockRiskData.filter(risk => risk.aiAnalysis.riskLevel === 'Low').length}
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-400/10 to-emerald-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="text-slate-300 text-lg font-semibold">Low Risk</div>
                <div className="text-slate-400 text-sm mt-1">Under control</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Risk List - Full Screen */}
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          <div className="glass-card p-8 rounded-3xl backdrop-blur-xl bg-white/15 border border-white/30 shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
                  Risk Intelligence
                </h2>
                <p className="text-slate-300 text-lg">Real-time threat monitoring and analysis</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-200 text-sm font-medium">Live Monitoring</span>
                </div>
                <div className="text-slate-400 text-sm">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {mockRiskData.map((risk, index) => (
                <div
                  key={risk._id}
                  className="glass-card-small p-8 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group transform hover:scale-[1.02] hover:shadow-2xl"
                  onClick={() => setSelectedRisk(risk)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mr-3 animate-pulse"></div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                          {risk.sourceUrl}
                        </h3>
                      </div>
                      {risk.scrapedContentSnippet && (
                        <p className="text-slate-300 text-base mb-4 line-clamp-3 leading-relaxed">
                          {risk.scrapedContentSnippet}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-3 ml-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getRiskLevelColor(risk.aiAnalysis.riskLevel)}`}>
                        {risk.aiAnalysis.riskLevel}
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getRiskCategoryColor(risk.aiAnalysis.riskCategory)}`}>
                        {risk.aiAnalysis.riskCategory}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-slate-400">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(risk.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        AI Verified
                      </span>
                    </div>
                    <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                      <span className="mr-2 font-medium">View Details</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Detail Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-8 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Risk Details</h2>
              <button
                onClick={() => setSelectedRisk(null)}
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Source URL */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Source URL</h3>
                <a
                  href={selectedRisk.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 break-all"
                >
                  {selectedRisk.sourceUrl}
                </a>
              </div>

              {/* Content Snippet */}
              {selectedRisk.scrapedContentSnippet && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Content Snippet</h3>
                  <p className="text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                    {selectedRisk.scrapedContentSnippet}
                  </p>
                </div>
              )}

              {/* AI Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">AI Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-sm">Risk Level:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(selectedRisk.aiAnalysis.riskLevel)}`}>
                      {selectedRisk.aiAnalysis.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Category:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getRiskCategoryColor(selectedRisk.aiAnalysis.riskCategory)}`}>
                      {selectedRisk.aiAnalysis.riskCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Justification</h3>
                <p className="text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                  {selectedRisk.aiAnalysis.justification}
                </p>
              </div>

              {/* Mitigation Strategy */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Mitigation Strategy</h3>
                <p className="text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                  {selectedRisk.aiAnalysis.mitigationStrategy}
                </p>
              </div>

              {/* Timestamp */}
              <div>
                <span className="text-slate-400 text-sm">Detected: {formatDate(selectedRisk.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
