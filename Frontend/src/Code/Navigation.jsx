import { BarChart3, Zap, Lock, LogOut } from "lucide-react";

const Navigation = ({ isAdmin, showAdminView, setShowAdminView, fetchStats, onAdminLogin, onLogout }) => {
  const handleShortenClick = () => {
    setShowAdminView(false); // Switch to shortener
  };

  const handleAnalyticsClick = () => {
    setShowAdminView(true); // Switch to analytics
    if (fetchStats) fetchStats();
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-full p-1">
        
        {/* Shorten URL */}
        <button
          onClick={handleShortenClick}
          className={`px-6 py-2 rounded-full transition-all duration-300 ${
            !showAdminView
              ? "bg-white text-purple-900 shadow-lg"
              : "text-white hover:bg-white/20"
          }`}
        >
          <Zap className="inline h-4 w-4 mr-2" />
          Shorten URL
        </button>

        {/* Show Analytics button only if admin */}
        {isAdmin && (
          <button
            onClick={handleAnalyticsClick}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              showAdminView
                ? "bg-white text-purple-900 shadow-lg"
                : "text-white hover:bg-white/20"
            }`}
          >
            <BarChart3 className="inline h-4 w-4 mr-2" />
            Analytics
          </button>
        )}

        {/* Admin Login/Logout Button */}
        {isAdmin ? (
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-full transition-all duration-300 bg-red-500/20 text-red-300 hover:bg-red-500/30"
            title="Click to logout from admin"
          >
            <LogOut className="inline h-4 w-4 mr-2" />
            Logout
          </button>
        ) : (
          <button
            onClick={onAdminLogin}
            className="px-4 py-2 rounded-full transition-all duration-300 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
            title="Click to login as admin"
          >
            <Lock className="inline h-4 w-4 mr-2" />
            Admin Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Navigation;
