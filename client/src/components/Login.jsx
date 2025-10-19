import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const result = isLogin 
        ? await login(formData.email, formData.password)
        : await register(formData.email, formData.password);

      if (!result.success) {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-0 relative overflow-hidden">
      {/* Enhanced Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Multiple animated orbs */}
        <div className="absolute -top-80 -right-80 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-slow"></div>
        <div className="absolute -bottom-80 -left-80 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/30 to-pink-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-reverse"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-emerald-400/20 to-cyan-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float-particle"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/30 rounded-full animate-float-particle"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-cyan-300/40 rounded-full animate-float-particle-delayed"></div>
        <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-purple-300/40 rounded-full animate-float-particle-slow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-emerald-300/40 rounded-full animate-float-particle"></div>
        <div className="absolute top-1/3 right-1/2 w-1 h-1 bg-yellow-300/40 rounded-full animate-float-particle-delayed"></div>
      </div>

      {/* Enhanced Login Form */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-8">
        <div className="glass-card p-10 rounded-3xl backdrop-blur-xl bg-white/15 border border-white/30 shadow-2xl">
          {/* Enhanced Header */}
          <div className="text-center mb-10">
            <div className="relative mb-6">
              <h1 className="text-6xl font-black text-white mb-4 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient-flow">
                VIGIL
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-full blur-xl opacity-50"></div>
            </div>
            <p className="text-slate-300 text-lg font-light tracking-wide">
              {isLogin ? 'Welcome back to your security command center' : 'Join the future of security intelligence'}
            </p>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-4"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
                {errors.general}
              </div>
            )}

            {/* Enhanced Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-200 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-6 py-4 rounded-2xl backdrop-blur-md bg-white/10 border-2 ${
                    errors.email ? 'border-red-400/50' : 'border-white/30'
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all duration-300 text-lg`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {errors.email && (
                <p className="mt-2 text-red-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Enhanced Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-6 py-4 rounded-2xl backdrop-blur-md bg-white/10 border-2 ${
                    errors.password ? 'border-red-400/50' : 'border-white/30'
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all duration-300 text-lg`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {errors.password && (
                <p className="mt-2 text-red-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field (Register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/5 border ${
                    errors.confirmPassword ? 'border-red-400/50' : 'border-white/20'
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-red-400 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Enhanced Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-2 border-cyan-400/40 text-white font-bold text-lg tracking-wide hover:from-cyan-500/40 hover:to-purple-500/40 hover:border-cyan-400/60 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 disabled:opacity-50 disabled:transform-none overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Access Command Center' : 'Join VIGIL Network'}
                      <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({ email: '', password: '', confirmPassword: '' });
                }}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
