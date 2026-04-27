import { BrowserRouter as Router,Routes,Route,Navigate } from "react-router";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
}

export default App;
