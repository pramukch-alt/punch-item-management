import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PunchList from './pages/PunchList';
import ItemDetails from './pages/ItemDetails';
import ImportExport from './pages/ImportExport';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Layout from './components/Layout';
import FieldApp from './pages/FieldApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/field-app" element={<FieldApp />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="punch-list" element={<PunchList />} />
          <Route path="punch-list/:id" element={<ItemDetails />} />
          <Route path="import-export" element={<ImportExport />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
