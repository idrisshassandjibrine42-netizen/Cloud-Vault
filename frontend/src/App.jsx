import { BrowserRouter } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <AppRoutes />

        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
