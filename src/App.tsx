import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleSelect } from '@/pages/RoleSelect';
import { EmployeeHome } from '@/pages/employee/EmployeeHome';
import { EmployeeNew } from '@/pages/employee/EmployeeNew';
import { EmployeeDetail } from '@/pages/employee/EmployeeDetail';
import { VisitorHome } from '@/pages/visitor/VisitorHome';
import { VisitorEdit } from '@/pages/visitor/VisitorEdit';
import { GuardHome } from '@/pages/guard/GuardHome';
import { GuardVerify } from '@/pages/guard/GuardVerify';
import { GuardRecords } from '@/pages/guard/GuardRecords';

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
        <Route path="/guard/verify" element={<GuardVerify />} />
        <Route path="/guard/records" element={<GuardRecords />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
