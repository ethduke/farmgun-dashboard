import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Runs after the pinned builder validates the report, inside its offline container.
const directory = process.argv[2];
if (!directory || process.argv.length !== 3) throw new Error('Expected site directory');
const report = JSON.parse(readFileSync(join(directory, 'snapshot-report.json'), 'utf8'));
const { analysis: a, session } = report;
if (!report.healthy || !report.checks.every(check => check.passed === true)) throw new Error('Unverified snapshot');
const count = value => value.toLocaleString('en-US');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const tokenAmount = (raw, compact = false) => new Intl.NumberFormat('en-US', {
  notation: compact ? 'compact' : 'standard', maximumFractionDigits: 2,
}).format(Number(raw) / 10 ** report.decimals);
const peak = a.hours.reduce((best, hour) => hour.transfers > best.transfers ? hour : best);
const complete = session.status === 'complete';
const lag = Math.max(0, Math.round((Date.parse(a.capturedAt) - Date.parse(a.end)) / 60000));
const total = BigInt(a.amountRaw);
const largestShare = total ? (Number((BigInt(a.largestRaw) * 10000n + total / 2n) / total) / 100).toFixed(2) : '0.00';
const findings = [
  ['Collection', `${complete ? 'Full 24 hours saved' : 'Partial snapshot'}; ${report.checks.length}/${report.checks.length} checks passed with no skipped query ranges, ${count(report.duplicatesIgnored)} duplicates and ${count(report.missingEventsRecovered)} recovered omissions.`],
  ['Delivery', `${count(report.failedChecks)} failed collection checks recorded.${complete ? ` Retries reached the end of the window; the final report was generated ${lag} minutes after it ended.` : ''} The 15-minute check interval is a target, not a delivery guarantee.`],
  ['Activity', complete && a.transfers ? `The peak hour starting ${peak.start.slice(0, 16).replace('T', ' ')} UTC had ${count(peak.transfers)} transfers (${(peak.transfers / (a.transfers / 24)).toFixed(2)}× the hourly average). This spike alone cannot identify bots or a collection fault.` : 'Hourly comparisons remain provisional until the full window is collected.'],
  ['Amounts', a.transfers ? `Median transfer: ${tokenAmount(a.medianRaw)} ${report.symbol}; largest: ${tokenAmount(a.largestRaw, true)} ${report.symbol} (${largestShare}% of the transferred amount). Large transfers skew the total.` : 'No transfers were recorded in the saved range.'],
  ['Limits', `${report.symbol} transfers only. One public RPC, repeated range reads and ${count(report.receiptBlocksVerified)} sampled block receipt audits cannot rule out consistent provider omissions. Amounts and addresses do not measure trading volume or user counts.`],
];
const dropdown = `<details class="checks-panel snapshot-findings" id="snapshot-findings"><summary>What does this data tell us?</summary><ul>${findings.map(([label, explanation]) => `<li><strong>${escape(label)}:</strong> ${escape(explanation)}</li>`).join('')}</ul></details>`;
const htmlPath = join(directory, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const anchor = '<section class="checks-panel" aria-labelledby="activity-heading">';
if (!html.includes(anchor) || html.includes('id="snapshot-findings"')) throw new Error('Unexpected dashboard layout');
writeFileSync(htmlPath, html.replace(anchor, `${dropdown}\n    ${anchor}`));
const cssPath = join(directory, 'dashboard.css');
writeFileSync(cssPath, readFileSync(cssPath, 'utf8') + '\n.snapshot-findings{margin:0 0 20px;font-size:13px}.snapshot-findings summary{font-weight:650}.snapshot-findings summary:focus-visible{outline:3px solid #648d27;outline-offset:4px}.snapshot-findings ul{padding-left:20px;margin:16px 0 0;font-size:12px;line-height:1.7}.snapshot-findings li+li{margin-top:10px}\n');
console.log('Aggregate snapshot findings rendered.');
