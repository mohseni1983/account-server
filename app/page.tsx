'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          سرویس VPN
        </h1>
        <div className="space-y-4">
          <Link
            href="/register"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ثبت نام
          </Link>
          <Link
            href="/track"
            className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            پیگیری درخواست
          </Link>
          <Link
            href="/downloads"
            className="block w-full bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            دانلود کلاینت
          </Link>
          {/* <Link
            href="/admin"
            className="block w-full bg-gray-600 text-white text-center py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
          >
            پنل مدیریت
          </Link> */}
        </div>
      </div>
    </div>
  );
}
