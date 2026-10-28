import crypto from 'crypto';
import type { ProtocolType } from '../../types/config.ts';

export interface ParsedConfigMeta {
  protocol: ProtocolType;
  server: string;
  port: number;
  remark: string;
  raw: string;
  identityHash: string;
}

export class ConfigParser {
  private static readonly PROTOCOL_PREFIXES: ProtocolType[] = [
    'vmess',
    'vless',
    'trojan',
    'ss',
    'ssr',
    'hy2',
    'hysteria2',
    'tuic',
    'wireguard',
  ];

  // Regex for extracting URI schemes
  private static readonly URI_REGEX =
    /(?:vmess|vless|trojan|ss|ssr|hy2|hysteria2|tuic|wireguard):\/\/[^\s<>"'\\]+/gi;

  /**
   * Safely decodes base64 string handling UTF-8 characters
   */
  public static decodeBase64(str: string): string {
    try {
      const normalized = str.trim().replace(/-/g, '+').replace(/_/g, '/');
      const padLen = (4 - (normalized.length % 4)) % 4;
      const padded = normalized + '='.repeat(padLen);
      return Buffer.from(padded, 'base64').toString('utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Safely decodes URI components, returning original string if decoding fails
   */
  public static safeDecodeUri(str: string): string {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  /**
   * Checks if a string might be a base64 encoded payload of configs
   */
  private static tryExtractFromBase64Payload(text: string): string[] {
    const lines = text.split(/\s+/);
    const discovered: string[] = [];

    for (const line of lines) {
      if (line.length > 30 && /^[A-Za-z0-9+/=_-]+$/.test(line)) {
        const decoded = this.decodeBase64(line);
        if (
          decoded &&
          (decoded.includes('://') || decoded.startsWith('{') || decoded.includes('vmess://'))
        ) {
          const matches = decoded.match(this.URI_REGEX);
          if (matches) {
            discovered.push(...matches);
          }
        }
      }
    }

    return discovered;
  }

  /**
   * Extracts raw config URLs from text
   */
  public static extractRawConfigs(text: string): string[] {
    if (!text) return [];

    const results = new Set<string>();

    // 1. Direct regex match
    const directMatches = text.match(this.URI_REGEX);
    if (directMatches) {
      for (const match of directMatches) {
        // Clean trailing punctuation
        const cleaned = match.replace(/[\.,;!?)]+$/, '');
        results.add(cleaned);
      }
    }

    // 2. Scan for base64 blocks
    const base64Discovered = this.tryExtractFromBase64Payload(text);
    for (const item of base64Discovered) {
      results.add(item.replace(/[\.,;!?)]+$/, ''));
    }

    return Array.from(results);
  }

  /**
   * Parses VMess config
   */
  private static parseVmess(raw: string): ParsedConfigMeta | null {
    try {
      const b64 = raw.replace(/^vmess:\/\//i, '');
      const jsonStr = this.decodeBase64(b64);
      if (!jsonStr) return null;

      const obj = JSON.parse(jsonStr);
      const server = obj.add || '';
      const port = parseInt(obj.port, 10) || 443;
      const remark = obj.ps || 'VMess Server';
      const uuid = obj.id || '';

      const identityHash = crypto
        .createHash('md5')
        .update(`vmess:${server}:${port}:${uuid}`)
        .digest('hex');

      return {
        protocol: 'vmess',
        server,
        port,
        remark: this.safeDecodeUri(remark),
        raw,
        identityHash,
      };
    } catch {
      return null;
    }
  }

  /**
   * Parses URL-based configs (VLESS, Trojan, TUIC, Hysteria2)
   */
  private static parseUrlBased(
    raw: string,
    protocol: ProtocolType
  ): ParsedConfigMeta | null {
    try {
      const url = new URL(raw);
      const server = url.hostname || '';
      const port = parseInt(url.port, 10) || (protocol === 'trojan' ? 443 : 80);
      const remark = url.hash ? this.safeDecodeUri(url.hash.slice(1)) : `${protocol.toUpperCase()} Server`;
      const credential = url.username || '';

      const identityHash = crypto
        .createHash('md5')
        .update(`${protocol}:${server}:${port}:${credential}:${url.search}`)
        .digest('hex');

      return {
        protocol,
        server,
        port,
        remark,
        raw,
        identityHash,
      };
    } catch {
      // Fallback manual regex for non-standard URLs
      const match = raw.match(
        /^[a-z0-9]+:\/\/([^@]+)@([^:/?#]+)(?::([0-9]+))?(?:[/?#]|$)/i
      );
      if (match) {
        const credential = match[1];
        const server = match[2];
        const port = match[3] ? parseInt(match[3], 10) : 443;
        const hashIdx = raw.indexOf('#');
        const remark =
          hashIdx !== -1
            ? this.safeDecodeUri(raw.slice(hashIdx + 1))
            : `${protocol.toUpperCase()} Server`;

        const identityHash = crypto
          .createHash('md5')
          .update(`${protocol}:${server}:${port}:${credential}`)
          .digest('hex');

        return {
          protocol,
          server,
          port,
          remark,
          raw,
          identityHash,
        };
      }
      return null;
    }
  }

  /**
   * Parses Shadowsocks configs (SIP002 or legacy base64)
   */
  private static parseShadowsocks(raw: string): ParsedConfigMeta | null {
    try {
      const withoutScheme = raw.replace(/^ss:\/\//i, '');
      const hashIdx = withoutScheme.indexOf('#');
      const remark =
        hashIdx !== -1
          ? this.safeDecodeUri(withoutScheme.slice(hashIdx + 1))
          : 'Shadowsocks Server';
      const mainPart = hashIdx !== -1 ? withoutScheme.slice(0, hashIdx) : withoutScheme;

      let server = '';
      let port = 8388;
      let identityKey = '';

      if (mainPart.includes('@')) {
        // SIP002 format: ss://[base64(method:password)]@host:port
        const atIdx = mainPart.indexOf('@');
        const hostPort = mainPart.slice(atIdx + 1).split('?')[0];
        const hpParts = hostPort.split(':');
        server = hpParts[0];
        port = parseInt(hpParts[1], 10) || 8388;
        identityKey = mainPart;
      } else {
        // Legacy format: ss://[base64(method:password@host:port)]
        const decoded = this.decodeBase64(mainPart);
        if (decoded.includes('@')) {
          const atIdx = decoded.indexOf('@');
          const hostPort = decoded.slice(atIdx + 1);
          const hpParts = hostPort.split(':');
          server = hpParts[0];
          port = parseInt(hpParts[1], 10) || 8388;
          identityKey = decoded;
        }
      }

      if (!server) return null;

      const identityHash = crypto
        .createHash('md5')
        .update(`ss:${server}:${port}:${identityKey}`)
        .digest('hex');

      return {
        protocol: 'ss',
        server,
        port,
        remark,
        raw,
        identityHash,
      };
    } catch {
      return null;
    }
  }

  /**
   * General parser for any raw V2Ray URI
   */
  public static parseConfig(raw: string): ParsedConfigMeta | null {
    const colonIdx = raw.indexOf('://');
    if (colonIdx === -1) return null;

    const scheme = raw.slice(0, colonIdx).toLowerCase() as ProtocolType;

    switch (scheme) {
      case 'vmess':
        return this.parseVmess(raw);
      case 'vless':
      case 'trojan':
      case 'hy2':
      case 'hysteria2':
      case 'tuic':
      case 'wireguard':
        return this.parseUrlBased(raw, scheme);
      case 'ss':
      case 'ssr':
        return this.parseShadowsocks(raw);
      default:
        return null;
    }
  }

  /**
   * Formats remark according to a user-defined template
   * Available variables: {channel}, {protocol}, {index}, {server}, {port}, {original}
   */
  public static formatRemark(
    template: string,
    meta: {
      channel: string;
      protocol: string;
      index: number;
      server: string;
      port: number;
      original: string;
    }
  ): string {
    return template
      .replace(/\{channel\}/g, meta.channel)
      .replace(/\{protocol\}/g, meta.protocol.toUpperCase())
      .replace(/\{index\}/g, meta.index.toString().padStart(2, '0'))
      .replace(/\{server\}/g, meta.server)
      .replace(/\{port\}/g, meta.port.toString())
      .replace(/\{original\}/g, meta.original);
  }

  /**
   * Applies new remark to raw config string
   */
  public static updateRemark(raw: string, newRemark: string): string {
    const encodedRemark = encodeURIComponent(newRemark);

    if (raw.startsWith('vmess://')) {
      try {
        const b64 = raw.slice(8);
        const jsonStr = this.decodeBase64(b64);
        if (!jsonStr) return raw;
        const obj = JSON.parse(jsonStr);
        obj.ps = newRemark;
        return `vmess://${Buffer.from(JSON.stringify(obj)).toString('base64')}`;
      } catch {
        return raw;
      }
    }

    const hashIdx = raw.indexOf('#');
    if (hashIdx !== -1) {
      return `${raw.slice(0, hashIdx)}#${encodedRemark}`;
    }
    return `${raw}#${encodedRemark}`;
  }
}
