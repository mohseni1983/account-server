'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    mobile: '',
    national_id: '',
    referrer_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در ثبت نام');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTrackingCode(data.tracking_code);
      setFormData({ mobile: '', national_id: '', referrer_name: '' });
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          ثبت نام
        </h1>

        {success ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">ثبت نام با موفقیت انجام شد!</p>
              <p className="mt-2">کد رهگیری شما:</p>
              <p className="text-2xl font-mono font-bold mt-2">{trackingCode}</p>
              <p className="text-sm mt-2">لطفاً این کد را یادداشت کنید</p>
            </div>
            <div className="space-y-2">
              <Link
                href="/track"
                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                پیگیری درخواست
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-600 text-white text-center py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                بازگشت به صفحه اصلی
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                شماره موبایل
              </label>
              <input
                type="tel"
                id="mobile"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="09123456789"
              />
            </div>

            <div>
              <label htmlFor="national_id" className="block text-sm font-medium text-gray-900 mb-1">
                کد ملی
              </label>
              <input
                type="text"
                id="national_id"
                required
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label htmlFor="referrer_name" className="block text-sm font-medium text-gray-900 mb-1">
                نام معرف
              </label>
              <input
                type="text"
                id="referrer_name"
                required
                value={formData.referrer_name}
                onChange={(e) => setFormData({ ...formData, referrer_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="نام معرف"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'در حال ثبت...' : 'ثبت نام'}
            </button>

            <Link
              href="/"
              className="block text-center text-blue-700 hover:text-blue-900 text-sm font-medium underline"
            >
              بازگشت به صفحه اصلی
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

