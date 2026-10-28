import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfigParser } from '../src/lib/parser/config-parser.ts';
import { ConfigNormalizer } from '../src/lib/parser/config-normalizer.ts';

test('ConfigParser extracts standard protocols', () => {
  const sampleText = `
    Here are configs:
    vless://b8313812-7901-443b-b27e-8c3453880c55@example.com:443?security=tls&type=ws#MyVless
    and another:
    trojan://password123@proxy.test.org:8443#TrojanNode
    and plain text irrelevant message.
  `;

  const extracted = ConfigParser.extractRawConfigs(sampleText);
  assert.equal(extracted.length, 2);
  assert.ok(extracted[0].includes('vless://'));
  assert.ok(extracted[1].includes('trojan://'));
});

test('ConfigParser parses VMess base64 correctly', () => {
  const vmessObj = {
    v: '2',
    ps: 'SampleVMess',
    add: 'vmess.example.com',
    port: 8080,
    id: 'a6e38b32-9b24-4f01-a20c-ef0f171c775a',
    aid: '0',
    net: 'ws',
    type: 'none',
    host: '',
    path: '/',
    tls: 'none',
  };
  const raw = `vmess://${Buffer.from(JSON.stringify(vmessObj)).toString('base64')}`;

  const parsed = ConfigParser.parseConfig(raw);
  assert.ok(parsed !== null);
  assert.equal(parsed.protocol, 'vmess');
  assert.equal(parsed.server, 'vmess.example.com');
  assert.equal(parsed.port, 8080);
  assert.equal(parsed.remark, 'SampleVMess');
});

test('ConfigNormalizer deduplicates identical nodes and formats remarks', () => {
  const vless1 = 'vless://uuid-1@myserver.com:443?type=tcp#OldRemark1';
  const vlessDuplicate = 'vless://uuid-1@myserver.com:443?type=tcp#DifferentRemark';
  const trojan1 = 'trojan://pass-2@myserver.com:8443#OldRemark2';

  const configs = ConfigNormalizer.processConfigs(
    [{ raw: vless1 }, { raw: vlessDuplicate }, { raw: trojan1 }],
    {
      channel: 'TestChannel',
      deduplicate: true,
      remarkTemplate: '{channel} | {protocol} #{index}',
    }
  );

  assert.equal(configs.length, 2); // Duplicate was eliminated
  assert.equal(configs[0].remark, 'TestChannel | VLESS #01');
  assert.equal(configs[1].remark, 'TestChannel | TROJAN #02');
  assert.ok(configs[0].raw.includes(encodeURIComponent('TestChannel | VLESS #01')));
});
