import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import wmirsLogo from "../assets/wmirs-logo.png";

export default function PendingApproval() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        // Force refresh the token to grab any new custom claims
        await currentUser.getIdToken(true);
        // Reload the page to force AuthContext to re-fetch the Firestore profile and re-evaluate routes
        window.location.reload();
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001e2b] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <img src={wmirsLogo} alt="WMIRS" className="w-24 h-24 mx-auto object-contain" />
      </div>
      
      <h1 className="text-3xl font-bold mb-4 text-[#00ed64]">Registration Pending</h1>
      
      <p className="text-gray-300 max-w-lg mb-8 text-lg leading-relaxed">
        Your account has been created successfully, but it requires administrator approval before you can access the system. 
        Please wait until an administrator assigns your role.
      </p>
      
      <div className="flex gap-4">
        <button 
          className="px-6 py-2 bg-[#00ed64] text-[#001e2b] rounded font-bold hover:bg-[#00c554] transition-colors disabled:opacity-50"
          onClick={handleCheckStatus} 
          disabled={loading}
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
        <button 
          className="px-6 py-2 bg-transparent border border-[#00ed64] text-[#00ed64] rounded font-bold hover:bg-[rgba(0,237,100,0.1)] transition-colors"
          onClick={() => logout()}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
