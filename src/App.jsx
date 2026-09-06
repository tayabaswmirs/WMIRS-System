import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";
import AppRoutes from "./routes/AppRoutes";
import { initSyncListeners } from "./services/syncService";

function App() {
  useEffect(() => {
    initSyncListeners();
  }, []);

  return (
    <LoadingProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;