import { BarChart3, Zap } from "lucide-react";

const Navigation = ({ isAdmin, showAdminView, setShowAdminView, fetchStats }) => {
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
      </div>
    </div>
  );
};

export default Navigation;
