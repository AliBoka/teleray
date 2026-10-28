export type ProtocolType =
  | 'vmess'
  | 'vless'
  | 'trojan'
  | 'ss'
  | 'ssr'
  | 'hy2'
  | 'hysteria2'
  | 'tuic'
  | 'wireguard';

export interface V2RayConfig {
  id: string;
  protocol: ProtocolType;
  raw: string;
  remark: string;
  server: string;
  port: number;
  channel: string;
  messageId?: number;
  extractedAt: string;
}

export interface ScrapeOptions {
  channel: string;
  limit?: number;
  protocols?: ProtocolType[];
  deduplicate?: boolean;
  remarkTemplate?: string;
}

export interface ScrapeResult {
  channel: string;
  totalMessagesScanned: number;
  configsFound: number;
  configs: V2RayConfig[];
  errors?: string[];
}

export interface SavedChannel {
  id: string;
  username: string;
  title?: string;
  lastScrapedAt?: string;
  configsCount?: number;
  autoSync?: boolean;
}
