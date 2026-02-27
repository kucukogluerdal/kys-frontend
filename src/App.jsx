import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Units from './pages/organization/Units';
import UnitDetail from './pages/organization/UnitDetail';
import Positions from './pages/organization/Positions';
import PositionDetail from './pages/organization/PositionDetail';
import Titles from './pages/organization/Titles';
import Roles from './pages/organization/Roles';
import PersonnelList from './pages/personnel/PersonnelList';
import PersonnelAssign from './pages/personnel/PersonnelAssign';
import PersonnelBulk from './pages/personnel/PersonnelBulk';
import Documents from './pages/dms/Documents';
import DocumentTypes from './pages/dms/DocumentTypes';
import DocumentStatuses from './pages/dms/DocumentStatuses';
import Distributions from './pages/dms/Distributions';
import Processes from './pages/processes/Processes';
import ProcessPage from './pages/processes/ProcessPage';
import KPIs from './pages/processes/KPIs';
import ProcessPortal from './pages/portal/ProcessPortal';
import ProcessViewPage from './pages/portal/ProcessViewPage';
import DataImport from './pages/settings/DataImport';
import ProcessCodePatterns from './pages/settings/ProcessCodePatterns';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Home />} />
        {/* Organizasyon */}
        <Route path="organization/units" element={<Units />} />
        <Route path="organization/units/:id" element={<UnitDetail />} />
        <Route path="organization/positions" element={<Positions />} />
        <Route path="organization/positions/:id" element={<PositionDetail />} />
        <Route path="organization/titles" element={<Titles />} />
        <Route path="organization/roles" element={<Roles />} />
        {/* Personel Yönetimi */}
        <Route path="personnel" element={<PersonnelList />} />
        <Route path="personnel/assign" element={<PersonnelAssign />} />
        <Route path="personnel/bulk" element={<PersonnelBulk />} />
        {/* DMS */}
        <Route path="dms/documents" element={<Documents />} />
        <Route path="dms/types" element={<DocumentTypes />} />
        <Route path="dms/statuses" element={<DocumentStatuses />} />
        <Route path="dms/distributions" element={<Distributions />} />
        {/* Süreç Portalı */}
        <Route path="portal" element={<ProcessPortal />} />
        <Route path="portal/:id" element={<ProcessViewPage />} />
        {/* Süreçler */}
        <Route path="processes" element={<Processes />} />
        <Route path="processes/kpis" element={<KPIs />} />
        <Route path="processes/:id" element={<ProcessPage />} />
        {/* Ayarlar */}
        <Route path="settings/import" element={<DataImport />} />
        <Route path="settings/code-patterns" element={<ProcessCodePatterns />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
