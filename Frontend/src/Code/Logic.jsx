import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, BarChart3, Download, Lock, X, Eye, EyeOff } from 'lucide-react';
import Navigation from './Navigation';
import { API_BASE } from '../config';

const Logic = () => {
  const [isAdmin, setIsAdmin] = useState(false); // Will be set to true after password verification
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Initialize rate limiting state from localStorage to persist across page refreshes
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const stored = localStorage.getItem('admin_login_attempts');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [isLocked, setIsLocked] = useState(() => {
    const stored = localStorage.getItem('admin_is_locked');
    return stored === 'true';
  });
  const [lockoutTime, setLockoutTime] = useState(() => {
    const stored = localStorage.getItem('admin_lockout_time');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [showAdminView, setShowAdminView] = useState(false);
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Custom slug states
  const [useCustom, setUseCustom] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState('idle'); // idle | checking | available | taken | invalid | error
  const [slugMessage, setSlugMessage] = useState('');

  const SLUG_REGEX = /^[A-Za-z0-9_-]{3,20}$/;

  // Ensure admin view cannot be shown without an admin key
  useEffect(() => {
    if (!isAdmin && showAdminView) {
      setShowAdminView(false);
    }
  }, [isAdmin, showAdminView]);

  // Check if user is locked out
  useEffect(() => {
    const checkLockout = () => {
      const now = Date.now();
      if (lockoutTime > 0 && now < lockoutTime) {
        setIsLocked(true);
      } else if (lockoutTime > 0 && now >= lockoutTime) {
        setIsLocked(false);
        setLockoutTime(0);
        setLoginAttempts(0);
        // Clear localStorage when lockout expires
        localStorage.removeItem('admin_is_locked');
        localStorage.removeItem('admin_lockout_time');
        localStorage.removeItem('admin_login_attempts');
      }
    };

    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // Persist rate limiting state to localStorage whenever it changes
  useEffect(() => {
    if (loginAttempts > 0) {
      localStorage.setItem('admin_login_attempts', loginAttempts.toString());
    }
  }, [loginAttempts]);

  useEffect(() => {
    if (isLocked) {
      localStorage.setItem('admin_is_locked', 'true');
    }
  }, [isLocked]);

  useEffect(() => {
    if (lockoutTime > 0) {
      localStorage.setItem('admin_lockout_time', lockoutTime.toString());
    }
  }, [lockoutTime]);

  // Password verification function
  const verifyPassword = async () => {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      setPasswordError(`Too many failed attempts. Please wait ${remainingTime} seconds.`);
      return;
    }

    try {
      setPasswordError('');
      
      const response = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAdmin(true);
        setShowPasswordModal(false);
        setPassword('');
        setPasswordError('');
        // Automatically switch to admin view after successful login
        setShowAdminView(true);
        if (fetchStats) fetchStats();
        
        // Show success message if it's the default password
        if (data.isDefaultPassword) {
          alert('Login successful! You are using the default password "admin123". Consider changing it for security.');
        }
        setLoginAttempts(0);
        setIsLocked(false);
        setLockoutTime(0);
        // Clear localStorage on successful login
        localStorage.removeItem('admin_login_attempts');
        localStorage.removeItem('admin_is_locked');
        localStorage.removeItem('admin_lockout_time');
      } else {
        handleFailedLogin();
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      handleFailedLogin();
    }
  };

  // Handle failed login attempts
  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    // Persist to localStorage
    localStorage.setItem('admin_login_attempts', newAttempts.toString());
    
    if (newAttempts >= 5) {
      // Lock for 5 minutes after 5 failed attempts
      const lockoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
      const newLockoutTime = Date.now() + lockoutDuration;
      setLockoutTime(newLockoutTime);
      setIsLocked(true);
      // Persist lockout state to localStorage
      localStorage.setItem('admin_is_locked', 'true');
      localStorage.setItem('admin_lockout_time', newLockoutTime.toString());
      setPasswordError('Too many failed attempts. Please wait 5 minutes.');
    } else {
      const remainingAttempts = 5 - newAttempts;
      setPasswordError(`Incorrect password. ${remainingAttempts} attempts remaining.`);
    }
  };

  // Handle password input key press
  const handlePasswordKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyPassword();
    }
  };

  // Change password function
  const changePassword = async () => {
    try {
      setChangePasswordError('');
      setChangePasswordSuccess('');
      
      const { currentPassword, newPassword, confirmPassword } = changePasswordData;
      
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        setChangePasswordError('All fields are required');
        return;
      }
      
      if (newPassword.length < 6) {
        setChangePasswordError('New password must be at least 6 characters long');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setChangePasswordError('New passwords do not match');
        return;
      }
      
      const response = await fetch(`${API_BASE}/admin/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setChangePasswordSuccess('Password updated successfully!');
        setChangePasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setChangePasswordSuccess('');
        }, 2000);
      } else {
        setChangePasswordError(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setChangePasswordError('Network error. Please try again.');
    }
  };

  // Logout function
  const logout = () => {
    setIsAdmin(false);
    setShowAdminView(false);
    // Don't clear rate limiting state on logout - user should still be locked out if they were
  };

  // Function to clear rate limiting state (useful for testing or admin use)
  const clearRateLimit = () => {
    setLoginAttempts(0);
    setIsLocked(false);
    setLockoutTime(0);
    localStorage.removeItem('admin_login_attempts');
    localStorage.removeItem('admin_is_locked');
    localStorage.removeItem('admin_lockout_time');
  };

  // URL validation function
  const validateUrl = (url) => {
    try {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return false;
      
      let urlToValidate = trimmedUrl;
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        urlToValidate = 'https://' + trimmedUrl;
      }
      
      const urlObj = new URL(urlToValidate);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      return false;
    }
  };

  // Debounced availability check for custom slug
  useEffect(() => {
    if (!useCustom) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    if (!customSlug) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    if (!SLUG_REGEX.test(customSlug)) {
      setSlugStatus('invalid');
      setSlugMessage('Use 3-20 chars: letters, numbers, hyphens, underscores');
      return;
    }

    setSlugStatus('checking');
    setSlugMessage('Checking...');

    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/availability?slug=${encodeURIComponent(customSlug)}`);
        const data = await res.json();
        if (data.status === 'available') {
          setSlugStatus('available');
          setSlugMessage('Available');
        } else if (data.status === 'taken') {
          setSlugStatus('taken');
          setSlugMessage('Already taken');
        } else if (data.status === 'invalid') {
          setSlugStatus('invalid');
          setSlugMessage('Invalid format');
        } else {
          setSlugStatus('error');
          setSlugMessage('Error checking availability');
        }
      } catch (e) {
        setSlugStatus('error');
        setSlugMessage('Error checking availability');
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [useCustom, customSlug]);

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download QR as PNG
  const downloadQr = async () => {
    try {
      if (!qrCodeUrl) return;
      const response = await fetch(qrCodeUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = shortUrl.split('/').pop() || 'qr';
      a.href = url;
      a.download = `qrcode-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download QR:', e);
    }
  };

  // Reset form function
  const resetForm = () => {
    setLongUrl('');
    setShortUrl('');
    setQrCodeUrl('');
    setError('');
    setCopied(false);
    setUseCustom(false);
    setCustomSlug('');
    setSlugStatus('idle');
    setSlugMessage('');
  };

  // Shorten URL function
  const shortenUrl = async () => {
    if (!longUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(longUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    if (useCustom) {
      if (slugStatus === 'checking') {
        setError('Please wait until availability check completes');
        return;
      }
      if (slugStatus !== 'available') {
        setError(slugMessage || 'Custom URL is not available');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      // Add protocol if missing
      let urlToSubmit = longUrl.trim();
      if (!urlToSubmit.startsWith('http://') && !urlToSubmit.startsWith('https://')) {
        urlToSubmit = 'https://' + urlToSubmit;
      }

      const body = useCustom && customSlug
        ? { originalUrl: urlToSubmit, customSlug: customSlug.trim() }
        : { originalUrl: urlToSubmit };

      const response = await fetch(`${API_BASE}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        // Map 409 to taken status if applicable
        if (response.status === 409) {
          setSlugStatus('taken');
          setSlugMessage('Already taken');
        }
        throw new Error(data.message || 'Failed to shorten URL');
      }

      const fullShort = data.fullShortUrl || `${API_BASE}/${data?.data?.shortUrl}`;
      setShortUrl(fullShort);
      setQrCodeUrl(data.qrCodeUrl || '');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics/stats data
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/admin/stats`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch stats: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setStats(data.urls || []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        <Navigation
          isAdmin={isAdmin}
          showAdminView={showAdminView}
          setShowAdminView={setShowAdminView}
          fetchStats={fetchStats}
          onAdminLogin={() => setShowPasswordModal(true)}
          onLogout={logout}
        />

        {showAdminView && isAdmin ? (
          /* Admin Analytics Panel */
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">URL Analytics Dashboard</h2>
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 flex items-center gap-2"
                  title="Change admin password"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </button>
              </div>
              
              {stats.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-300 mr-2"></div>
                      <p className="text-blue-200">Loading analytics...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-blue-200">No data available yet</p>
                      <p className="text-blue-300 text-sm mt-2">Create some short URLs to see analytics here</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="pb-3 text-blue-200 font-semibold">Short Code</th>
                        <th className="pb-3 text-blue-200 font-semibold">Original URL</th>
                        <th className="pb-3 text-blue-200 font-semibold">Clicks</th>
                        <th className="pb-3 text-blue-200 font-semibold">Created</th>
                        <th className="pb-3 text-blue-200 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((url, index) => (
                        <>
                          <tr key={(url._id || index) + '-row'} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-4">
                              <code className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded">
                                {url.shortUrl}
                              </code>
                            </td>
                            <td className="py-4 text-white max-w-md">
                              <div className="truncate" title={url.originalUrl}>
                                {url.originalUrl}
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="bg-green-500/20 text-green-200 px-3 py-1 rounded-full">
                                {url.totalClicks || 0}
                              </span>
                            </td>
                            <td className="py-4 text-blue-200">
                              {new Date(url.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 space-x-3">
                              <a
                                href={`${API_BASE}/${url.shortUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                title="Open short URL"
                              >
                                <ExternalLink className="h-4 w-4 inline" />
                              </a>
                              <button
                                onClick={() => setExpandedRowId(expandedRowId === (url._id || index) ? null : (url._id || index))}
                                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline"
                                title={expandedRowId === (url._id || index) ? 'Hide IPs' : 'View IPs'}
                              >
                                {expandedRowId === (url._id || index) ? 'Hide IPs' : 'View IPs'}
                              </button>
                            </td>
                          </tr>
                          {expandedRowId === (url._id || index) && (
                            <tr key={(url._id || index) + '-ips'} className="border-b border-white/10">
                              <td colSpan={5} className="py-3">
                                {url.history && url.history.length > 0 ? (
                                  <div className="text-blue-100">
                                    <div className="mb-2 text-sm text-blue-200">Visitor IPs (aggregated by IP):</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {url.history.map((h, i) => (
                                        <div key={h.ip + '-' + i} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                                          <code className="text-blue-200">{h.ip}</code>
                                          <span className="text-green-200 text-sm">{h.count} {h.count === 1 ? 'click' : 'clicks'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-blue-200">No IP data yet</div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* URL Shortener Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Enter your long URL
                  </label>
                  <input
                    type="url"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder="https://www.example.com/some/very/long/path"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && shortenUrl()}
                  />
                </div>

                {/* Custom slug toggle */}
                <div className="flex items-center gap-3">
                  <input
                    id="useCustom"
                    type="checkbox"
                    checked={useCustom}
                    onChange={(e) => {
                      setUseCustom(e.target.checked);
                      if (!e.target.checked) {
                        setCustomSlug('');
                        setSlugStatus('idle');
                        setSlugMessage('');
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor="useCustom" className="text-blue-100 select-none">Use custom short URL</label>
                </div>

                {/* Custom slug input */}
                {useCustom && (
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Custom URL (3-20 chars: letters, numbers, hyphens, underscores)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value)}
                        placeholder="my-custom-alias"
                        className={`flex-1 px-4 py-3 bg-white/20 border rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                          slugStatus === 'invalid' || slugStatus === 'taken'
                            ? 'border-red-500/70 focus:ring-red-400'
                            : slugStatus === 'available'
                            ? 'border-green-500/70 focus:ring-green-400'
                            : 'border-white/30 focus:ring-blue-400'
                        }`}
                        disabled={loading}
                      />
                      <div className="min-w-[120px] text-sm">
                        {slugStatus === 'checking' && (
                          <span className="text-blue-200">Checking...</span>
                        )}
                        {slugStatus === 'available' && (
                          <span className="text-green-300">Available</span>
                        )}
                        {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                          <span className="text-red-300">{slugMessage || (slugStatus === 'taken' ? 'Already taken' : 'Invalid')}</span>
                        )}
                        {slugStatus === 'error' && (
                          <span className="text-red-300">Error checking</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                    {error}
                  </div>
                )}

                <button
                  onClick={shortenUrl}
                  disabled={loading || (useCustom && (slugStatus !== 'available'))}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Shortening...
                    </div>
                  ) : (
                    'Shorten URL'
                  )}
                </button>
              </div>

              {shortUrl && (
                <div className="mt-8 p-6 bg-green-500/20 border border-green-500/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-green-200 mb-3">Your shortened URL:</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={shortUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* QR Preview and Download */}
                  {qrCodeUrl && (
                    <div className="mt-5 flex items-center gap-4">
                      <img src={qrCodeUrl} alt="QR code" className="w-32 h-32 rounded bg-white p-2" />
                      <button
                        onClick={downloadQr}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <Download className="h-4 w-4" />
                        Download QR
                      </button>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={resetForm}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Shorten Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        
      </div>
      {copied && (
        <div className="fixed top-4 right-4 z-50">
          <div
            role="status"
            aria-live="polite"
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-xl"
          >
            Copied to clipboard
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Admin Login</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handlePasswordKeyPress}
                    disabled={isLocked}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    } ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLocked}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>

              <button
                onClick={verifyPassword}
                disabled={isLocked || !password.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isLocked || !password.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isLocked ? 'Login Locked' : 'Login'}
              </button>

              {isLocked && lockoutTime > 0 && (
                <p className="text-sm text-gray-600 text-center">
                  Locked until {new Date(lockoutTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showChangePassword.current ? "text" : "password"}
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      currentPassword: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangePassword({
                      ...showChangePassword,
                      current: !showChangePassword.current
                    })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showChangePassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showChangePassword.new ? "text" : "password"}
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      newPassword: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangePassword({
                      ...showChangePassword,
                      new: !showChangePassword.new
                    })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showChangePassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showChangePassword.confirm ? "text" : "password"}
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      confirmPassword: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangePassword({
                      ...showChangePassword,
                      confirm: !showChangePassword.confirm
                    })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showChangePassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {changePasswordError && (
                <p className="text-sm text-red-600">{changePasswordError}</p>
              )}

              {changePasswordSuccess && (
                <p className="text-sm text-green-600">{changePasswordSuccess}</p>
              )}

              <button
                onClick={changePassword}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-all duration-200"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logic;