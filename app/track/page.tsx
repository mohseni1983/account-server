'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TrackPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUserData(null);

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracking_code: trackingCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در جستجو');
        setLoading(false);
        return;
      }

      setUserData(data.user);
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'در انتظار بررسی', color: 'yellow' };
      case 'approved':
        return { text: 'تایید شده', color: 'green' };
      case 'rejected':
        return { text: 'رد شده', color: 'red' };
      default:
        return { text: status, color: 'gray' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          پیگیری درخواست
        </h1>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="کد رهگیری را وارد کنید"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'جستجو...' : 'جستجو'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {userData && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">اطلاعات درخواست</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">شماره موبایل:</span>
                  <span className="mr-2 font-medium">{userData.mobile}</span>
                </div>
                <div>
                  <span className="text-gray-600">کد ملی:</span>
                  <span className="mr-2 font-medium">{userData.national_id}</span>
                </div>
                <div>
                  <span className="text-gray-600">نام معرف:</span>
                  <span className="mr-2 font-medium">{userData.referrer_name}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">وضعیت:</span>
                  <span
                    className={`mr-2 font-bold ${
                      userData.status === 'approved' 
                        ? 'text-green-700' 
                        : userData.status === 'pending' 
                        ? 'text-yellow-700' 
                        : 'text-red-700'
                    }`}
                  >
                    {getStatusText(userData.status).text}
                  </span>
                </div>
              </div>
            </div>

            {userData.status === 'approved' && (
              <div className="space-y-4">
                {/* Bandwidth Info */}
                {(userData.bandwidth_limit > 0 || userData.bandwidth_used > 0) && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-bold mb-3 text-gray-900">اطلاعات ترافیک</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">استفاده شده:</span>
                        <span className="font-mono font-bold text-gray-900">
                          {userData.bandwidth_used 
                            ? `${(userData.bandwidth_used / 1024 / 1024 / 1024).toFixed(2)} GB`
                            : '0 GB'}
                        </span>
                      </div>
                      {userData.bandwidth_limit > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">محدودیت:</span>
                            <span className="font-mono font-bold text-gray-900">
                              {(userData.bandwidth_limit / 1024 / 1024 / 1024).toFixed(2)} GB
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                (userData.bandwidth_used / userData.bandwidth_limit) * 100 > 90
                                  ? 'bg-red-600'
                                  : (userData.bandwidth_used / userData.bandwidth_limit) * 100 > 70
                                  ? 'bg-yellow-600'
                                  : 'bg-green-600'
                              }`}
                              style={{
                                width: `${Math.min(100, (userData.bandwidth_used / userData.bandwidth_limit) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            {Math.round((userData.bandwidth_used / userData.bandwidth_limit) * 100)}% استفاده شده
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection Info */}
                <div className={`border rounded-lg p-4 ${
                  userData.connection_type === 'v2ray' 
                    ? 'border-purple-200 bg-purple-50' 
                    : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">
                    اطلاعات اتصال ({userData.connection_type === 'v2ray' ? 'V2Ray' : 'OpenVPN'})
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-700 font-medium">نام کاربری:</span>
                      <span className="mr-2 font-mono font-bold text-gray-900">{userData.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">رمز عبور:</span>
                      <span className="mr-2 font-mono font-bold text-gray-900">{userData.password}</span>
                    </div>

                    {/* OpenVPN Profile */}
                    {userData.connection_type === 'openvpn' && userData.profile_file_path && (
                      <div className="mt-4">
                        <a
                          href={`/api/download/${userData.profile_file_path}`}
                          download
                          className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          دانلود فایل پروفایل OpenVPN
                        </a>
                      </div>
                    )}

                    {/* V2Ray Profile */}
                    {userData.connection_type === 'v2ray' && userData.v2ray_config && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            لینک V2Ray:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={userData.v2ray_config}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-mono text-sm"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(userData.v2ray_config);
                                alert('لینک کپی شد');
                              }}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                              کپی
                            </button>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 mb-2">QR Code:</p>
                          <img
                            src={`/api/qrcode?data=${encodeURIComponent(userData.v2ray_config)}`}
                            alt="V2Ray QR Code"
                            className="mx-auto border-2 border-gray-300 rounded-lg p-2 bg-white"
                            style={{ maxWidth: '250px' }}
                          />
                          <p className="text-xs text-gray-600 mt-2">
                            این QR Code را با اپلیکیشن V2Ray اسکن کنید
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}

