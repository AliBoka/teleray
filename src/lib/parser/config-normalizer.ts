import type { ScrapeOptions, V2RayConfig } from '../../types/config.ts';
import { ConfigParser } from './config-parser.ts';

export class ConfigNormalizer {
  /**
   * Normalizes, filters, deduplicates and customizes remarks for configs
   */
  public static processConfigs(
    rawStrings: { raw: string; messageId?: number }[],
    options: ScrapeOptions
  ): V2RayConfig[] {
    const {
      channel,
      protocols,
      deduplicate = true,
      remarkTemplate = '',
    } = options;

    const allowedProtocols = protocols && protocols.length > 0 ? new Set(protocols) : null;
    const seenHashes = new Set<string>();
    const processedList: V2RayConfig[] = [];
    let counter = 1;

    for (const item of rawStrings) {
      const parsed = ConfigParser.parseConfig(item.raw);
      if (!parsed) continue;

      // Protocol filter check
      if (allowedProtocols && !allowedProtocols.has(parsed.protocol)) {
        continue;
      }

      // Deduplication check
      if (deduplicate && seenHashes.has(parsed.identityHash)) {
        continue;
      }
      seenHashes.add(parsed.identityHash);

      // Custom remark generation if template provided
      let finalRemark = parsed.remark;
      let finalRaw = parsed.raw;

      if (remarkTemplate && remarkTemplate.trim() !== '') {
        finalRemark = ConfigParser.formatRemark(remarkTemplate, {
          channel,
          protocol: parsed.protocol,
          index: counter,
          server: parsed.server,
          port: parsed.port,
          original: parsed.remark,
        });
        finalRaw = ConfigParser.updateRemark(parsed.raw, finalRemark);
      }

      processedList.push({
        id: parsed.identityHash,
        protocol: parsed.protocol,
        raw: finalRaw,
        remark: finalRemark,
        server: parsed.server,
        port: parsed.port,
        channel,
        messageId: item.messageId,
        extractedAt: new Date().toISOString(),
      });

      counter++;
    }

    return processedList;
  }
}
