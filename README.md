<p align="center">
  <img src="web/public/favicon.svg" alt="Doqtri" width="72" height="72" />
</p>

<h1 align="center">Doqtri</h1>

<p align="center">
  <strong>Living documents → executable mindmaps → on-chain proof</strong>
</p>

<p align="center">
  Compile plans into mindmaps, track Planned → Verified build status, and anchor
  every version hash on <a href="https://stellar.org">Stellar</a> so “planned vs shipped” is ledger-true.
</p>

<p align="center">
  <a href="https://lab.stellar.org/r/testnet/contract/CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ"><img src="https://img.shields.io/badge/Stellar-Testnet_Contract-7D00FF?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar testnet" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-1FA971?style=for-the-badge" alt="MIT" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Soroban-7D00FF?style=flat-square&logo=stellar&logoColor=white" alt="Soroban" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Freighter-0B0D10?style=flat-square&logo=stellar&logoColor=white" alt="Freighter" />
</p>

---

## Vision

Most roadmaps live in docs. Most “shipped” badges live in app state. Those two
worlds drift apart.

**Doqtri** closes the gap:

1. Watch a living source (Docs, Notion, markdown).
2. Compile it into a typed, executable mindmap.
3. When a node is scaffolded into n8n / Make / Retool / Langflow, record build status.
4. Anchor document content hashes and node lifecycle on Stellar Soroban so
   anyone can verify progress from the ledger — not a private database.

> Planned vs shipped becomes a receipt, not a marketing claim.

---

## Features

### On-chain registry (`contract/`)

- **Document versions** — SHA-256 content hash per `doc_id`, version increments on every semantic update
- **Node build status** — `Planned → Building → Built → Verified` with tool name + artifact ref
- **Owner auth** — every write requires `require_auth()` on the document owner
- **Persistent storage + TTL** — 30-day threshold, extend to 90 days on write
- **Events** — `register`, `update`, and `node` topics via `symbol_short!`

### Web app (`web/`)

- Dark, Cursor-inspired landing with sticky interactive mindmap
- Freighter login via [Stellar Wallets Kit](https://stellarwalletskit.dev/) (Freighter-only)
- Live Soroban reads against the deployed testnet contract (falls back to demo data)
- How-it-works flow: Doc → Hash → Mindmap → Build → Stellar

---

## Deployed contract (Stellar Testnet)

| Field | Value |
| --- | --- |
| **Network** | Stellar Testnet |
| **Contract ID** | [`CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ`](https://lab.stellar.org/r/testnet/contract/CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ) |
| **CLI alias** | `doqtri` |
| **WASM hash** | `30171e542f579f6eef71365587cd797c29081ae263b37afd8f863c74e3a83789` |

**Explorer links**

- [Open in Stellar Lab](https://lab.stellar.org/r/testnet/contract/CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ)
- [Deploy transaction (Expert)](https://stellar.expert/explorer/testnet/tx/3ccbf69d08a6ceb6b0dd1222f6c2bd113946a9b1cc23ac5f914f631bba9d56af)
- [WASM upload transaction (Expert)](https://stellar.expert/explorer/testnet/tx/0cb1103faec72be5d4e8fb69fdf443ba44192bad330d3a5a03f79194fa576348)

---

## Tech stack

| Layer | Package | Badge |
| --- | --- | --- |
| Smart contracts | [soroban-sdk](https://crates.io/crates/soroban-sdk) `22` | ![Soroban](https://img.shields.io/badge/soroban--sdk-22-7D00FF?logo=rust&logoColor=white) |
| Contract language | [Rust](https://www.rust-lang.org/) | ![Rust](https://img.shields.io/badge/Rust-stable-black?logo=rust) |
| CLI / deploy | [Stellar CLI](https://developers.stellar.org/docs/tools/cli) | ![Stellar](https://img.shields.io/badge/stellar--cli-25+-7D00FF?logo=stellar&logoColor=white) |
| Frontend | [Next.js](https://nextjs.org/) `15` + [React](https://react.dev/) `19` | ![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs) |
| Language | [TypeScript](https://www.typescriptlang.org/) | ![TS](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) |
| Chain client | [@stellar/stellar-sdk](https://www.npmjs.com/package/@stellar/stellar-sdk) | ![SDK](https://img.shields.io/badge/stellar--sdk-16-7D00FF?logo=stellar&logoColor=white) |
| Wallet | [@creit.tech/stellar-wallets-kit](https://www.npmjs.com/package/@creit.tech/stellar-wallets-kit) + Freighter | ![Freighter](https://img.shields.io/badge/Freighter-wallet-0B0D10?logo=stellar&logoColor=white) |
| Fonts | Instrument Sans · Outfit · IBM Plex Mono | ![Fonts](https://img.shields.io/badge/fonts-Google_Fonts-4285F4?logo=googlefonts&logoColor=white) |

---

## Repository layout

```text
doqtri/
├── contract/          # Soroban crate: DoqtriRegistry
│   └── src/
│       ├── lib.rs     # contract + storage + events
│       └── test.rs    # unit tests
├── web/               # Next.js App Router frontend
│   └── src/
│       ├── app/       # pages, layout, OG image
│       ├── components/
│       ├── data/      # demo mindmap + contract constants
│       └── lib/       # Soroban reads + Freighter wallet
├── vendor/            # pinned ed25519-dalek 2.2.0 (Soroban host compat)
├── .github/workflows/ # CI: cargo test + stellar contract build
└── README.md
```

---

## Architecture

```text
  Living doc          Doqtri backend           Stellar testnet
 ┌──────────┐        ┌──────────────┐        ┌─────────────────┐
 │ Notion / │  hash  │ mindmap +    │ invoke │ DoqtriRegistry  │
 │ Docs /   ├───────►│ status sync  ├───────►│ versions+nodes  │
 │ markdown │        │              │        └────────┬────────┘
 └──────────┘        └──────────────┘                 │
                                                      │ read
                      ┌──────────────┐                │
                      │ web/ (Next)  │◄───────────────┘
                      │ Freighter    │
                      │ mindmap UI   │
                      └──────────────┘
```

---

## Contract interface

| Function | Auth | Description |
| --- | --- | --- |
| `register_document(owner, doc_id, content_hash)` | owner | Anchor a new document at version `1` |
| `update_document(doc_id, new_hash)` | owner | Anchor a new hash; returns incremented version |
| `set_node_status(doc_id, node_id, status, tool, artifact_ref)` | owner | Record node lifecycle |
| `get_document(doc_id)` | none | Read anchored document state |
| `get_node(doc_id, node_id)` | none | Read a node’s build record |

**Node statuses:** `Planned` · `Building` · `Built` · `Verified`

**Storage keys:** `DataKey::Doc(doc_id)` · `DataKey::Node(doc_id, node_id)`  
**TTL:** threshold 30 days → extend to 90 days on every write (`1 day = 17280` ledgers)

---

## Quick start — web

Prerequisites: Node 20+, [Freighter](https://freighter.app/) (for Log in).

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Log in** (nav) connects Freighter on testnet via Stellar Wallets Kit  
- Mindmap may show **on-chain** when the demo doc exists on the registry, otherwise **demo** data

```bash
npm run build   # production build
npm run start   # serve production build
```

---

## Quick start — contract

Prerequisites:

- Rust stable + `rustup target add wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli)

```bash
# from repo root
cargo test -p doqtri-registry

cd contract
stellar contract build
```

WASM (workspace layout):

`target/wasm32v1-none/release/doqtri_registry.wasm`

### Deploy (testnet)

```bash
# one-time identity
stellar keys generate alice --network testnet --fund

stellar contract deploy \
  --wasm ../target/wasm32v1-none/release/doqtri_registry.wasm \
  --source alice \
  --network testnet \
  --alias doqtri
```

### Invoke (live contract)

```bash
CONTRACT=CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ

stellar contract invoke \
  --id $CONTRACT --source alice --network testnet -- \
  register_document \
  --owner alice \
  --doc_id "doqtri-launch-plan" \
  --content_hash 0101010101010101010101010101010101010101010101010101010101010101

stellar contract invoke \
  --id $CONTRACT --source alice --network testnet -- \
  set_node_status \
  --doc_id "doqtri-launch-plan" \
  --node_id "node-weekly-report" \
  --status '"Built"' \
  --tool "n8n" \
  --artifact_ref "wf_8Xk2p"

stellar contract invoke \
  --id $CONTRACT --source alice --network testnet -- \
  get_document --doc_id "doqtri-launch-plan"
```

---

## CI

GitHub Actions (`.github/workflows/ci.yml`):

1. **Test** — `cargo test -p doqtri-registry`
2. **Build WASM** — install Stellar CLI, `stellar contract build`, upload artifact

---

## Roadmap (near-term)

- [ ] Register / update documents from the web UI (signed Freighter txs)
- [ ] Sync real mindmap nodes from a source document pipeline
- [ ] Mainnet deploy + contract verification
- [ ] Public audit page by `doc_id`

---

## License

MIT — see project root.
