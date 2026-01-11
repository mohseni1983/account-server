import { v4 as uuidv4 } from 'uuid';

export interface V2RayConfig {
  v: string;
  ps: string;
  add: string;
  port: string;
  id: string;
  aid: string;
  scy: string;
  net: string;
  type: string;
  host: string;
  path: string;
  tls: string;
  sni: string;
  alpn: string;
}

export interface V2RayServerConfig {
  address: string;
  port: number;
  uuid?: string;
  alterId?: number;
  security?: string;
  network?: string;
  type?: string;
  host?: string;
  path?: string;
  tls?: boolean;
  sni?: string;
  alpn?: string;
}

// Default V2Ray server configuration
// These should be configured based on your actual V2Ray server
const DEFAULT_V2RAY_CONFIG: V2RayServerConfig = {
  address: process.env.V2RAY_SERVER_ADDRESS || 'your-v2ray-server.com',
  port: parseInt(process.env.V2RAY_SERVER_PORT || '443'),
  alterId: 0,
  security: 'auto',
  network: 'ws',
  type: 'none',
  path: '/v2ray',
  tls: true,
  sni: process.env.V2RAY_SERVER_SNI || 'your-v2ray-server.com',
  alpn: 'h2,http/1.1',
};

export function generateV2RayUUID(): string {
  return uuidv4();
}

export function generateV2RayVMessLink(config: V2RayConfig): string {
  const jsonStr = JSON.stringify(config);
  const base64 = Buffer.from(jsonStr).toString('base64');
  return `vmess://${base64}`;
}

export function generateV2RayVLESSLink(config: Partial<V2RayConfig & { encryption?: string }>): string {
  const params = new URLSearchParams();
  if (config.type) params.append('type', config.type);
  if ((config as any).encryption) params.append('encryption', (config as any).encryption);
  if (config.tls) params.append('security', config.tls);
  if (config.sni) params.append('sni', config.sni);
  if (config.alpn) params.append('alpn', config.alpn);
  if (config.path) params.append('path', config.path);
  if (config.host) params.append('host', config.host);
  
  const query = params.toString();
  return `vless://${config.id}@${config.add}:${config.port}?${query}#${encodeURIComponent(config.ps || '')}`;
}

export function createV2RayConfig(
  uuid: string,
  serverConfig: Partial<V2RayServerConfig> = {},
  remark: string = 'V2Ray Account'
): V2RayConfig {
  const config = { ...DEFAULT_V2RAY_CONFIG, ...serverConfig };
  
  return {
    v: '2',
    ps: remark,
    add: config.address,
    port: config.port.toString(),
    id: uuid,
    aid: (config.alterId || 0).toString(),
    scy: config.security || 'auto',
    net: config.network || 'ws',
    type: config.type || 'none',
    host: config.host || config.address,
    path: config.path || '/v2ray',
    tls: config.tls ? 'tls' : '',
    sni: config.sni || config.address,
    alpn: config.alpn || '',
  };
}

export function formatBandwidth(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getBandwidthPercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

