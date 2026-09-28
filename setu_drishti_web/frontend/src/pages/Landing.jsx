import React from 'react';
import { SignIn, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Activity, ShieldAlert, Cpu, HeartPulse, ArrowRight, StethoscopeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing({ mockupAuth }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-gray-300 font-sans selection:bg-cyan-900/60 flex overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.5)_1px,transparent_1px)] bg-[length:50px_50px] pointer-events-none opacity-30"></div>

      {/* Hero Content */}
      <div className="w-1/2 p-12 flex flex-col justify-center relative z-10">
        <div className="space-y-8 max-w-xl">
          {/* Logo and Brand */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
                <HeartPulse size={18} className="text-cyan-400 animate-heartbeat" />
              </div>
              <span className="text-sm font-semibold tracking-widest text-cyan-400">Clinical AI Platform</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-6xl font-display font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent leading-tight drop-shadow-lg">
              Predicting Sepsis Before It Strikes
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"></div>
          </div>

          {/* Subheading */}
          <p className="text-lg text-gray-300 leading-relaxed max-w-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Setu-Drishti is an advanced <span className="text-cyan-300 font-semibold">Clinical Decision Support System</span> that unifies live EMR telemetry, XGBoost predictive modeling, and real-time biometric scanning into a fully integrated ICU ward command dashboard.
          </p>

          {/* Features List */}
          <div className="space-y-3 mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: Cpu, label: 'Dual-Engine AI', desc: 'XGBoost & Clinical Rules', color: 'cyan' },
              { icon: HeartPulse, label: 'Automated Alerting', desc: 'Sub-second SMS Dispatch', color: 'red' },
              { icon: ShieldAlert, label: 'Digital Twin Scan', desc: 'Explainable Organ Insights', color: 'purple' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-smooth group hover:shadow-lg animate-fade-in"
                style={{
                  backgroundColor: feature.color === 'cyan' ? 'rgba(34, 211, 238, 0.05)' : feature.color === 'red' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(168, 85, 247, 0.05)',
                  borderColor: feature.color === 'cyan' ? 'rgba(34, 211, 238, 0.3)' : feature.color === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(168, 85, 247, 0.3)',
                  animationDelay: `${0.4 + i * 0.1}s`,
                }}
              >
                <div className={`p-3 rounded-lg border ${
                  feature.color === 'cyan' 
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                    : feature.color === 'red'
                    ? 'bg-red-950/40 border-red-500/30 text-red-400'
                    : 'bg-purple-950/40 border-purple-500/30 text-purple-400'
                }`}>
                  <feature.icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100">{feature.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-smooth" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { value: '40K+', label: 'Patients' },
              { value: '99.2%', label: 'Accuracy' },
              { value: '<1s', label: 'Detection' },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/20 backdrop-blur-sm text-center hover:border-cyan-500/50 transition-smooth">
                <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Panel */}
      <div className="w-1/2 flex flex-col items-center justify-center relative z-10 p-12">
        <div className="max-w-md w-full">
          {mockupAuth ? (
            <div className="animate-slide-up">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 mb-6">
                  <StethoscopeIcon size={32} className="text-cyan-400" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Physician Portal</h2>
                <p className="text-sm text-gray-400 tracking-wide">ICU Clinical Command Center</p>
              </div>

              <div className="group relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl overflow-hidden shadow-hospital-lg hover:shadow-hospital-xl transition-smooth">
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500/30 via-transparent to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative p-8">
                  <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 w-fit mx-auto">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <h3 className="text-cyan-400 font-semibold text-sm tracking-widest uppercase">Demo Mode Active</h3>
                  </div>

                  <p className="text-xs text-gray-400 mb-8 text-center leading-relaxed">
                    Authentication bypassed for hackathon demonstration. Full Clerk integration available in production.
                  </p>

                  <Link 
                    to="/dashboard"
                    className="block w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold py-3 px-6 rounded-xl transition-smooth uppercase tracking-widest text-center shadow-neon-cyan hover:shadow-lg flex items-center justify-center gap-2 group"
                  >
                    <span>Access Ward Command</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-smooth" />
                  </Link>
                </div>
              </div>

              <p className="text-center text-xs text-gray-600 mt-6">
                🔒 HIPAA Compliant • 🛡️ Enterprise Security • 🚀 Real-time Processing
              </p>
            </div>
          ) : (
            <>
              <SignedOut>
                <div className="mb-8 text-center animate-slide-up">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 mb-6">
                    <Activity size={32} className="text-cyan-400" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-white mb-2">Secure Sign In</h2>
                  <p className="text-sm text-gray-400 tracking-wide">Hospital Authentication Required</p>
                </div>

                <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl overflow-hidden shadow-hospital-lg hover:shadow-hospital-xl transition-smooth">
                  <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 opacity-50"></div>
                  <div className="relative p-6">
                    <SignIn routing="path" path="/" appearance={{
                      elements: {
                        card: "bg-transparent shadow-none border-none",
                        headerTitle: "text-white font-display font-bold text-xl",
                        headerSubtitle: "text-gray-400 font-sans text-sm",
                        socialButtonsBlockButton: "bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 text-white font-sans hover:shadow-lg transition-smooth",
                        formFieldLabel: "text-gray-400 font-sans text-sm font-medium",
                        formFieldInput: "bg-slate-900/50 border-slate-700/50 text-white font-mono placeholder:text-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-lg",
                        formButtonPrimary: "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 font-sans font-semibold uppercase tracking-wider rounded-lg shadow-neon-cyan hover:shadow-lg transition-smooth",
                        footerActionText: "text-gray-500 font-sans text-sm",
                        footerActionLink: "text-cyan-400 hover:text-cyan-300 font-semibold transition-smooth"
                      }
                    }} />
                  </div>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="text-center backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-10 rounded-2xl border border-slate-700/50 shadow-hospital-lg animate-slide-up">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-neon-cyan">
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Authentication Verified</h3>
                  <p className="text-gray-400 mb-8 text-sm leading-relaxed">Secure connection established. Ready to access ICU dashboard.</p>
                  <Link 
                    to="/dashboard" 
                    className="inline-block w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold py-3 px-8 rounded-xl transition-smooth uppercase tracking-widest shadow-neon-cyan hover:shadow-lg"
                  >
                    Enter Ward Command
                  </Link>
                </div>
              </SignedIn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
