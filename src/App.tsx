import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RoleSelect } from '@/pages/RoleSelect';
import { EmployeeHome } from '@/pages/employee/EmployeeHome';
import { EmployeeNew } from '@/pages/employee/EmployeeNew';
import { EmployeeDetail } from '@/pages/employee/EmployeeDetail';
import { VisitorHome } from '@/pages/visitor/VisitorHome';
import { VisitorEdit } from '@/pages/visitor/VisitorEdit';
import { GuardHome } from '@/pages/guard/GuardHome';
import { GuardVerify } from '@/pages/guard/GuardVerify';
import { GuardRecords } from '@/pages/guard/GuardRecords';

function GuardVerifyWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const key = params.get('type') || 'entry';
  return <GuardVerify key={key} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />

        <Route path="/employee" element={<EmployeeHome />} />
        <Route path="/employee/new" element={<EmployeeNew />} />
        <Route path="/employee/:id" element={<EmployeeDetail />} />

        <Route path="/visitor" element={<VisitorHome />} />
        <Route path="/visitor/:id" element={<VisitorEdit />} />

        <Route path="/guard" element={<GuardHome />} />
        <Route path="/guard/verify" element={<GuardVerifyWrapper />} />
        <Route path="/guard/records" element={<GuardRecords />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
