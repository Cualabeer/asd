import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GarageDashboardGolden from './components/GarageDashboardGolden';
import CustomerDashboardGolden from './components/CustomerDashboardGolden';
import AdminDashboardGolden from './components/AdminDashboardGolden';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/garage" element={<GarageDashboardGolden />} />
        <Route path="/customer" element={<CustomerDashboardGolden />} />
        <Route path="/admin" element={<AdminDashboardGolden />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;