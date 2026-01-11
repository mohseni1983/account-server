'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ClientFile {
  id: number;
  platform: string;
  name: string;
  file_path: string;
  file_size: number | null;
  description: string | null;
}

interface ClientLink {
  name: string;
  url: string;
  external: boolean;
  description?: string;
}

export default function DownloadsPage() {
  const [uploadedFiles, setUploadedFiles] = useState<ClientFile[]>([]);
  const [loading] = useState(true);

  useEffect(() => {
    fetchClientFiles();
  }, []);

  const fetchClientFiles = async () => {
    try {
      const response = await fetch('/api/client-files');
      const data = await response.json();
      if (data.success) {
        setUploadedFiles(data.files);
      }
    } catch (err) {
      console.error('Error fetching client files:', err);
    }
  };

  const defaultClients = [
    {
      name: 'Windows',
      icon: '🪟',
      platform: 'Windows',
      links: [
        { name: 'OpenVPN Connect (راهنما)', url: 'https://openvpn.net/client-connect-vpn-for-windows/', external: true },
      ],
    },
    {
      name: 'macOS',
      icon: '🍎',
      platform: 'macOS',
      links: [
        { name: 'OpenVPN Connect (راهنما)', url: 'https://openvpn.net/client-connect-vpn-for-mac-os/', external: true },
      ],
    },
    {
      name: 'Android',
      icon: '🤖',
      platform: 'Android',
      links: [
        { name: 'Google Play', url: 'https://play.google.com/store/apps/details?id=net.openvpn.openvpn', external: true },
      ],
    },
    {
      name: 'iOS',
      icon: '📱',
      platform: 'iOS',
      links: [
        { name: 'App Store', url: 'https://apps.apple.com/app/openvpn-connect/id590379981', external: true },
      ],
    },
    {
      name: 'Linux',
      icon: '🐧',
      platform: 'Linux',
      links: [
        { name: 'راهنمای نصب', url: 'https://openvpn.net/client-connect-vpn-for-linux/', external: true },
      ],
    },
  ];

  // Group uploaded files by platform
  const filesByPlatform = uploadedFiles.reduce((acc: Record<string, ClientFile[]>, file: ClientFile) => {
    if (!acc[file.platform]) {
      acc[file.platform] = [];
    }
    acc[file.platform].push(file);
    return acc;
  }, {});

  // Merge default clients with uploaded files
  const clients = defaultClients.map((client) => {
    const uploaded = filesByPlatform[client.platform] || [];
    const uploadedLinks: ClientLink[] = uploaded.map((file: ClientFile) => ({
      name: file.name,
      url: `/api/download-client/${file.id}`,
      external: false,
      description: file.description || undefined,
    }));

    return {
      ...client,
      links: [...client.links, ...uploadedLinks] as ClientLink[],
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            دانلود کلاینت OpenVPN
          </h1>

          <div className="space-y-6">
            {clients.map((client) => (
              <div key={client.name} className="border border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <span className="text-2xl">{client.icon}</span>
                  {client.name}
                </h2>
                <div className="space-y-2">
                  {client.links.map((link, idx) => (
                    <div key={idx}>
                      <a
                        href={link.url}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        download={!link.external}
                        className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                      >
                        {link.name}
                      </a>
                      {link.description && (
                        <p className="text-xs text-gray-600 mt-1 text-center">{link.description}</p>
                      )}
                    </div>
                  ))}
                  {client.links.length === 0 && (
                    <p className="text-gray-500 text-center py-2">فایلی برای این پلتفرم آپلود نشده است</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-bold mb-2 text-gray-900">راهنمای استفاده:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800">
              <li>کلاینت مناسب سیستم عامل خود را دانلود و نصب کنید</li>
              <li>پس از تایید درخواست، فایل پروفایل را از صفحه پیگیری دانلود کنید</li>
              <li>فایل پروفایل را در کلاینت OpenVPN وارد کنید</li>
              <li>با استفاده از نام کاربری و رمز عبور ارائه شده متصل شوید</li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-blue-700 hover:text-blue-900 font-medium underline"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

