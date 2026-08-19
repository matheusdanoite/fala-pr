import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CitizenProfile from './pages/CitizenProfile';
import DemandsList from './pages/DemandsList';
import NewDemand from './pages/NewDemand';
import Success from './pages/Success';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<CitizenProfile />} />
            <Route path="/demands" element={<DemandsList />} />
            <Route path="/new-demand" element={<NewDemand />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
