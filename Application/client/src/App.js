import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login-reigister/Login/Login';
import Signup from './login-reigister/Signup/Signup';
import AdvancePage from './users/pages/AdvancePage';
import AlertPage from './users/pages/AlertPage';
import BasicPage from './users/pages/BasicPage';
import AdminRec from './users/pages/AdminRec';
import AccessDenied from './users/pages/AccessDenied';
import Sidebar from './admins/components/Sidebar/Sidebar';
import ForgotPassword from './login-reigister/Login/ForgotPassword';
import ResetPassword from './login-reigister/Login/ResetPassword';
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [adminCode, setAdminCode] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminCodeFromStorage = localStorage.getItem('adminCode');

    if (token) {
      setIsLoggedIn(true);
      setUserRole(isAdmin ? 'admin' : 'patient');
      if (isAdmin) {
        setAdminCode(adminCodeFromStorage); // ดึง adminCode จาก localStorage
      }
    }
  }, []);

  const handleLogin = () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminCode = localStorage.getItem('adminCode');
  
    // ถ้า user ไม่ใช่ admin แต่กรอก code admin
    if (!isAdmin && adminCode) {
      localStorage.clear();
      setIsLoggedIn(false);
      setUserRole(null);
      setAdminCode(null);
      return <Navigate to="/access-denied" />;
    }
  
    setIsLoggedIn(true);
    setUserRole(isAdmin ? 'admin' : 'patient');
    if (isAdmin) {
      setAdminCode(adminCode);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false); 
    setUserRole(null); 
    setAdminCode(null);  
  };

  const renderAdminRoutes = () => (
    <div className="app-with-sidebar">
      <Sidebar onLogout={handleLogout} adminCode={adminCode} />
    </div>
  );  

  const renderPatientRoutes = (Component) => (
    isLoggedIn && userRole === 'patient' ? (
      <Component onLogout={handleLogout} />
    ) : (
      <Navigate to="/login" />
    )
  );

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/basic'} />
            )
          }
        />
        <Route path="/signup" element={!isLoggedIn ? <Signup /> : <Navigate to="/" />} />

        {/* New Forgot Password Route */}
        <Route path="/forgot-password" element={!isLoggedIn ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            isLoggedIn && userRole === 'admin' ? (
              renderAdminRoutes()
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Patient Routes */}
        <Route path="/basic" element={renderPatientRoutes(BasicPage)} />
        <Route path="/advance" element={renderPatientRoutes(AdvancePage)} />
        <Route path="/alert" element={renderPatientRoutes(AlertPage)} />
        <Route path="/admin-rec" element={renderPatientRoutes(AdminRec)} />

        {/* Other Routes */}
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
