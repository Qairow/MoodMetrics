import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterRole from './pages/RegisterRole';
import RegisterAdmin from './pages/RegisterAdmin';
import RegisterHR from './pages/RegisterHR';
import RegisterManager from './pages/RegisterManager';
import RegisterEmployee from './pages/RegisterEmployee';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import Zones from './pages/Zones';
import Employee from './pages/Employee';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import PulseSurvey from './pages/PulseSurvey';
import SurveyCreate from './pages/SurveyCreate';
import SurveyDetails from './pages/SurveyDetails';
import PendingUsers from './pages/PendingUsers';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

<Route path="/app/survey/pulse" element={<PulseSurvey />} />
<Route path="/app/admin/users" element={<AdminUsers />} />

<Route path="/app/surveys/new" element={<SurveyCreate />} />
<Route path="/app/surveys/:id" element={<SurveyDetails />} />
<Route path="/app/admin/pending" element={<PendingUsers />} />
<Route path="/app/surveys/create" element={<SurveyCreate />} />
<Route path="/app/surveys/:id" element={<SurveyDetails />} />


          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
                    
          <Route path="/register" element={<RegisterRole />} />
          <Route path="/register/admin" element={<RegisterAdmin />} />
          <Route path="/register/hr" element={<RegisterHR />} />
          <Route path="/register/manager" element={<RegisterManager />} />
          <Route path="/register/employee" element={<RegisterEmployee />} />
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="zones" element={<Zones />} />
            <Route path="employee" element={<Employee />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
