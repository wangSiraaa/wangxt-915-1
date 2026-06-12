import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Shield, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore.js';

export function RoleSelect() {
  const navigate = useNavigate();
  const setRole = useAppStore((state) => state.setRole);

  const roles = [
    {
      id: 'employee',
      name: '员工端',
      description: '创建访客预约，管理预约记录',
      icon: Users,
      color: 'from-slate-800 to-slate-700',
      path: '/employee',
    },
    {
      id: 'visitor',
      name: '访客端',
      description: '补充车辆信息，查看预约状态',
      icon: UserPlus,
      color: 'from-emerald-700 to-emerald-600',
      path: '/visitor',
    },
    {
      id: 'guard',
      name: '门岗端',
      description: '入离园核验，通行记录查询',
      icon: Shield,
      color: 'from-blue-800 to-blue-700',
      path: '/guard',
    },
    {
      id: 'security_supervisor',
      name: '安保主管',
      description: '延期审批，滞留车辆管理',
      icon: ShieldCheck,
      color: 'from-purple-800 to-purple-700',
      path: '/supervisor',
    },
  ];

  const handleSelect = (role: string, path: string) => {
    setRole(role as any);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            园区访客车辆通行管理系统
          </h1>
          <p className="text-slate-400 text-lg">
            请选择您的身份进入系统
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => handleSelect(role.id, role.path)}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {role.name}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {role.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-slate-500 group-hover:text-white/70 text-sm transition-colors">
                  进入系统
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>支持黑名单校验 · 预约有效期管控 · 滞留预警 · 延期审批 · 入离园记录审计</p>
        </div>
      </div>
    </div>
  );
}
