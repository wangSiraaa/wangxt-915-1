import { useNavigate, useLocation } from 'react-router-dom';
import { Home, UserPlus, Car, FileText, ArrowLeft, Shield, Users, ClipboardList, ShieldCheck, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore.js';
import { cn } from '@/lib/utils.js';

interface LayoutProps {
  children: React.ReactNode;
  role: 'employee' | 'visitor' | 'guard' | 'security_supervisor';
}

const navItems = {
  employee: [
    { path: '/employee', label: '预约列表', icon: FileText },
    { path: '/employee/new', label: '新建预约', icon: UserPlus },
  ],
  visitor: [
    { path: '/visitor', label: '我的预约', icon: FileText },
  ],
  guard: [
    { path: '/guard', label: '入园核验', icon: Shield },
    { path: '/guard/exit', label: '离园登记', icon: Car },
    { path: '/guard/records', label: '通行记录', icon: ClipboardList },
  ],
  security_supervisor: [
    { path: '/supervisor', label: '延期审批', icon: Clock },
    { path: '/supervisor/detained', label: '滞留车辆', icon: Shield },
  ],
};

const roleNames = {
  employee: '员工端',
  visitor: '访客端',
  guard: '门岗端',
  security_supervisor: '安保主管',
};

const roleColors = {
  employee: 'from-slate-800 to-slate-700',
  visitor: 'from-emerald-700 to-emerald-600',
  guard: 'from-blue-800 to-blue-700',
  security_supervisor: 'from-purple-800 to-purple-700',
};

export function Layout({ children, role }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const setRole = useAppStore((state) => state.setRole);

  const handleBackToHome = () => {
    setRole(null);
    navigate('/');
  };

  const items = navItems[role];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className={cn('p-6 bg-gradient-to-r text-white', roleColors[role])}>
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            返回选择
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {role === 'employee' && <Users size={20} />}
              {role === 'visitor' && <UserPlus size={20} />}
              {role === 'guard' && <Shield size={20} />}
              {role === 'security_supervisor' && <ShieldCheck size={20} />}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{roleNames[role]}</h1>
              <p className="text-sm text-white/70">园区访客管理</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            园区访客车辆通行系统 v1.0
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
