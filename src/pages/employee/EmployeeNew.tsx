import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { Input } from '@/components/Input.js';
import { appointmentApi } from '@/services/api.js';

export function EmployeeNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorCompany: '',
    purpose: '',
    department: '技术部',
    employeeName: '李工',
    employeePhone: '13900139001',
    startTime: '',
    endTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.visitorName) newErrors.visitorName = '请输入访客姓名';
    if (!formData.visitorPhone) newErrors.visitorPhone = '请输入访客手机号';
    if (!formData.purpose) newErrors.purpose = '请输入来访事由';
    if (!formData.startTime) newErrors.startTime = '请选择开始时间';
    if (!formData.endTime) newErrors.endTime = '请选择结束时间';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await appointmentApi.create(formData);
      navigate(`/employee/${result.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="employee">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/employee')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新建访客预约</h1>
            <p className="text-gray-500 mt-1">填写访客信息创建预约</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">访客信息</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="访客姓名"
                  name="visitorName"
                  value={formData.visitorName}
                  onChange={handleChange}
                  error={errors.visitorName}
                  placeholder="请输入访客姓名"
                />
                <Input
                  label="访客手机号"
                  name="visitorPhone"
                  value={formData.visitorPhone}
                  onChange={handleChange}
                  error={errors.visitorPhone}
                  placeholder="请输入手机号"
                />
                <div className="col-span-2">
                  <Input
                    label="访客单位（选填）"
                    name="visitorCompany"
                    value={formData.visitorCompany}
                    onChange={handleChange}
                    placeholder="请输入访客所在单位"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-6">
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">来访信息</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    受访部门
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="技术部">技术部</option>
                    <option value="产品部">产品部</option>
                    <option value="市场部">市场部</option>
                    <option value="人事部">人事部</option>
                    <option value="财务部">财务部</option>
                    <option value="行政部">行政部</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    受访员工
                  </label>
                  <Input
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    来访事由
                  </label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    rows={3}
                    placeholder="请详细描述来访事由"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                      errors.purpose ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-6">
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">预约时间</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="开始时间"
                  name="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={handleChange}
                  error={errors.startTime}
                />
                <Input
                  label="结束时间"
                  name="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={handleChange}
                  error={errors.endTime}
                />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                提示：访客收到预约后可自行补充车牌号码和同行人数
              </p>
            </Card.Body>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/employee')}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={16} className="mr-2" />
              {loading ? '提交中...' : '提交预约'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
