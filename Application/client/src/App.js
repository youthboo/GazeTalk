import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
import { SoundProvider } from "./users/context/SoundContext";
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [adminCode, setAdminCode] = useState(null);

  // ฟังก์ชันตรวจสอบการหมดอายุของ token
  const checkTokenExpiration = useCallback(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000; 
        if (decodedToken.exp < currentTime) {
          handleLogout(); 
        }
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, []);

  // ตรวจสอบการหมดอายุของ token ใน useEffect
  useEffect(() => {
    checkTokenExpiration(); // ตรวจสอบทุกครั้งที่โหลดหน้า
  }, [checkTokenExpiration]);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const adminCodeFromStorage = sessionStorage.getItem('adminCode');
  
    if (token) {
      setIsLoggedIn(true);
      setUserRole(isAdmin ? 'admin' : 'patient');
      if (isAdmin) {
        setAdminCode(adminCodeFromStorage);
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }, []);
  
  const handleLogin = () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const adminCode = sessionStorage.getItem('adminCode');
  
    // ถ้า user ไม่ใช่ admin แต่กรอก code admin
    if (!isAdmin && adminCode) {
      sessionStorage.clear();
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
      <SoundProvider> 
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              !isLoggedIn ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to={
                  userRole === "admin"
                    ? adminCode === "SecretCodeAdmin"
                      ? "/admin/dashboard-caretaker"
                      : "/admin/dashboard"
                    : "/basic"
                } />
                
              )
            }
          />
          <Route path="/signup" element={!isLoggedIn ? <Signup /> : <Navigate to="/" />} />
  
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token/:userType" element={<ResetPassword />} />
  
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              isLoggedIn && userRole === "admin" ? renderAdminRoutes() : <Navigate to="/login" />
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
      </SoundProvider>
    </Router>
  );
};

export default App;  
