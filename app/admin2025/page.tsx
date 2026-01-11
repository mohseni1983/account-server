'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [token, setToken] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approveData, setApproveData] = useState<{ 
    [key: number]: { 
      username: string; 
      password: string; 
      connection_type?: string;
      bandwidth_limit?: string;
      v2ray_config?: string;
    } 
  }>({});
  const [activeTab, setActiveTab] = useState<'users' | 'files' | 'settings'>('users');
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState({
    platform: '',
    name: '',
    description: '',
    file: null as File | null,
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchUsers(savedToken);
      fetchClientFiles(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در ورود');
        setLoading(false);
        return;
      }

      setToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem('admin_token', data.token);
      fetchUsers(data.token);
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (authToken: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchClientFiles = async (authToken: string) => {
    try {
      const response = await fetch('/api/admin/client-files', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setClientFiles(data.files);
      }
    } catch (err) {
      console.error('Error fetching client files:', err);
    }
  };

  const handleApprove = async (userId: number) => {
    const approveInfo = approveData[userId];
    if (!approveInfo || !approveInfo.username || !approveInfo.password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          username: approveInfo.username,
          password: approveInfo.password,
          connection_type: approveInfo.connection_type || 'openvpn',
          bandwidth_limit: approveInfo.bandwidth_limit ? parseInt(approveInfo.bandwidth_limit) * 1024 * 1024 * 1024 : 0, // Convert GB to bytes
          v2ray_config: approveInfo.v2ray_config,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در تایید درخواست');
        setLoading(false);
        return;
      }

      // Refresh users list
      await fetchUsers(token);
      setApproveData({ 
        ...approveData, 
        [userId]: { 
          username: '', 
          password: '', 
          connection_type: 'openvpn',
          bandwidth_limit: '',
          v2ray_config: '',
        } 
      });
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setIsLoggedIn(false);
    setUsers([]);
    setClientFiles([]);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'خطا در تغییر رمز عبور');
        setLoading(false);
        return;
      }

      setPasswordSuccess('رمز عبور با موفقیت تغییر کرد');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.platform || !uploadData.name) {
      setError('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('platform', uploadData.platform);
      formData.append('name', uploadData.name);
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }

      const response = await fetch('/api/admin/upload-client', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در آپلود فایل');
        setLoading(false);
        return;
      }

      // Reset form and refresh files
      setUploadData({ platform: '', name: '', description: '', file: null });
      fetchClientFiles(token);
      setError('');
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/client-files?id=${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در حذف فایل');
        setLoading(false);
        return;
      }

      fetchClientFiles(token);
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'در انتظار', color: 'yellow' };
      case 'approved':
        return { text: 'تایید شده', color: 'green' };
      case 'rejected':
        return { text: 'رد شده', color: 'red' };
      default:
        return { text: status, color: 'gray' };
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            ورود به پنل مدیریت
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-1">
                نام کاربری
              </label>
              <input
                type="text"
                id="username"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                رمز عبور
              </label>
              <input
                type="password"
                id="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">پنل مدیریت</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              خروج
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200" dir="rtl">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              مدیریت کاربران
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'files'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              مدیریت فایل‌های کلاینت
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              تنظیمات
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Upload Form */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900 mb-4">آپلود فایل کلاینت جدید</h2>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        پلتفرم
                      </label>
                      <select
                        required
                        value={uploadData.platform}
                        onChange={(e) => setUploadData({ ...uploadData, platform: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="">انتخاب کنید</option>
                        <option value="Windows">Windows</option>
                        <option value="macOS">macOS</option>
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                        <option value="Linux">Linux</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        نام فایل
                      </label>
                      <input
                        type="text"
                        required
                        value={uploadData.name}
                        onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="مثال: OpenVPN Connect v3.4.0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      توضیحات (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="توضیحات فایل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      فایل
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'در حال آپلود...' : 'آپلود فایل'}
                  </button>
                </form>
              </div>

              {/* Files List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 p-4 bg-gray-100 border-b border-gray-200">
                  فایل‌های آپلود شده
                </h2>
                <div className="overflow-x-auto" dir="rtl">
                  <table className="w-full border-collapse" dir="rtl">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">پلتفرم</th>
                        <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">نام</th>
                        <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">توضیحات</th>
                        <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">حجم</th>
                        <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-2 text-gray-900">{file.platform}</td>
                          <td className="border border-gray-200 p-2 text-gray-900 font-medium">{file.name}</td>
                          <td className="border border-gray-200 p-2 text-gray-700">{file.description || '-'}</td>
                          <td className="border border-gray-200 p-2 text-gray-900">
                            {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                          </td>
                          <td className="border border-gray-200 p-2">
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              disabled={loading}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {clientFiles.length === 0 && (
                    <div className="text-center py-8 text-gray-700 font-medium">
                      فایلی آپلود نشده است
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto" dir="rtl">
            <table className="w-full border-collapse" dir="rtl">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">کد رهگیری</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">موبایل</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">کد ملی</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">نام معرف</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">وضعیت</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">نوع اتصال</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">نام کاربری</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">رمز عبور</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">محدودیت ترافیک (GB)</th>
                  <th className="border border-gray-300 p-2 text-right text-gray-900 font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2 font-mono text-gray-900">{user.tracking_code}</td>
                    <td className="border border-gray-200 p-2 text-gray-900">{user.mobile}</td>
                    <td className="border border-gray-200 p-2 text-gray-900">{user.national_id}</td>
                    <td className="border border-gray-200 p-2 text-gray-900">{user.referrer_name}</td>
                    <td className="border border-gray-200 p-2">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          user.status === 'approved' 
                            ? 'bg-green-100 text-green-900' 
                            : user.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-900' 
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {getStatusText(user.status).text}
                      </span>
                    </td>
                    <td className="border border-gray-200 p-2">
                      {user.status === 'approved' ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.connection_type === 'v2ray' 
                            ? 'bg-purple-100 text-purple-900' 
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {user.connection_type === 'v2ray' ? 'V2Ray' : 'OpenVPN'}
                        </span>
                      ) : (
                        <select
                          value={approveData[user.id]?.connection_type || 'openvpn'}
                          onChange={(e) =>
                            setApproveData({
                              ...approveData,
                              [user.id]: {
                                ...approveData[user.id],
                                connection_type: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900 bg-white"
                        >
                          <option value="openvpn">OpenVPN</option>
                          <option value="v2ray">V2Ray</option>
                        </select>
                      )}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {user.status === 'approved' ? (
                        <span className="font-mono text-gray-900 font-bold">{user.username}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="نام کاربری"
                          value={approveData[user.id]?.username || ''}
                          onChange={(e) =>
                            setApproveData({
                              ...approveData,
                              [user.id]: {
                                ...approveData[user.id],
                                username: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900 bg-white"
                        />
                      )}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {user.status === 'approved' ? (
                        <span className="font-mono text-gray-900 font-bold">{user.password}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="رمز عبور"
                          value={approveData[user.id]?.password || ''}
                          onChange={(e) =>
                            setApproveData({
                              ...approveData,
                              [user.id]: {
                                ...approveData[user.id],
                                password: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900 bg-white"
                        />
                      )}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {user.status === 'approved' ? (
                        <span className="text-gray-900">
                          {user.bandwidth_limit ? `${(user.bandwidth_limit / 1024 / 1024 / 1024).toFixed(2)} GB` : 'نامحدود'}
                        </span>
                      ) : (
                        <input
                          type="number"
                          placeholder="GB (0 = نامحدود)"
                          value={approveData[user.id]?.bandwidth_limit || ''}
                          onChange={(e) =>
                            setApproveData({
                              ...approveData,
                              [user.id]: {
                                ...approveData[user.id],
                                bandwidth_limit: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900 bg-white"
                          min="0"
                          step="0.1"
                        />
                      )}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {user.status === 'pending' && (
                        <div className="space-y-2">
                          {approveData[user.id]?.connection_type === 'v2ray' && (
                            <div>
                              <textarea
                                placeholder="آدرس کامل V2Ray (vmess:// یا vless://)"
                                value={approveData[user.id]?.v2ray_config || ''}
                                onChange={(e) =>
                                  setApproveData({
                                    ...approveData,
                                    [user.id]: {
                                      ...approveData[user.id],
                                      v2ray_config: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1 border rounded text-xs text-gray-900 bg-white"
                                rows={3}
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={loading}
                            className="w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            تایید
                          </button>
                        </div>
                      )}
                      {user.status === 'approved' && (
                        <div className="space-y-1">
                          {user.connection_type === 'openvpn' && user.profile_file_path && (
                            <a
                              href={`/api/download/${user.profile_file_path}`}
                              download
                              className="block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                            >
                              دانلود OpenVPN
                            </a>
                          )}
                          {user.connection_type === 'v2ray' && user.v2ray_config && (
                            <span className="block text-xs text-gray-600 text-center">V2Ray فعال</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-700 font-medium">
                درخواستی یافت نشد
              </div>
            )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900 mb-4">تغییر رمز عبور</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      رمز عبور فعلی
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      رمز عبور جدید
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">حداقل ۶ کاراکتر</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      تأیید رمز عبور جدید
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

