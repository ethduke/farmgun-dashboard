# Farmgun data-quality dashboard

Published at **https://ethduke.github.io/farmgun-dashboard/**.

This is an aggregate-only showcase of incremental SQL backfills, normalized
tables, reconciliation, duplicate recovery, missing-block recovery, and recorded
synthetic fork replay. It is not a live blockchain monitor or a claim about a
historical mainnet reorg.

`source.json` pins the reviewed implementation in the public pipeline repository.
The Pages workflow checks out that exact commit, runs its recovery tests in a
network-disabled container, generates evidence from real SQLite queries, validates
all 24 final scenario checks, and publishes only static assets and aggregate JSON.
It then verifies the exact public report digest and page health.

No application data, database files, wallet identities, RPC credentials, private
keys, raw request logs, or provider errors are copied here. No signing or transaction
submission occurs. Publishing uses GitHub's short-lived Pages token; it needs no
cross-repository write token or paid server.

To update the demonstration, review a new source revision, update the commit in
`source.json`, and push or dispatch **Publish data-quality dashboard**. To restore
an earlier version, revert the pin to its previous reviewed commit and publish.
Source code: https://github.com/ethduke/fungun/tree/main/apps/data-pipeline

Live collection is a manually started local CLI session using only Robinhood's
public RPC, with checks every 15 minutes and a fixed 24-hour stopping point.
SQLite stays on the collector's machine. The website stays frozen until its owner
runs `npm run data:publish -- --report local/robinhood-showcase/snapshot-report.json`
from the pipeline repository. Only aggregate JSON is sent to the owner-guarded
`Refresh real-chain snapshot` workflow; it performs no RPC requests and dispatches
Pages after saving the report. Partial snapshots show their actual duration.
There are no scheduled collection workflows or public refresh controls.
