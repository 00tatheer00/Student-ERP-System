import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Results from './pages/Results';
import Fees from './pages/Fees';
import Fines from './pages/Fines';
import Departments from './pages/Departments';
import Reports from './pages/Reports';
import PortalStudent from './pages/PortalStudent';
import PortalParent from './pages/PortalParent';
import Enrollments from './pages/Enrollments';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/fees" element={<Fees />} />
                  <Route path="/fines" element={<Fines />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/portal/student" element={<PortalStudent />} />
                  <Route path="/portal/parent" element={<PortalParent />} />
                  <Route path="/enrollments" element={<Enrollments />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
