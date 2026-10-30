# TG V2Ray Exporter

> A modern, zero-config tool for extracting, filtering, and exporting V2Ray configurations from public Telegram channels. Built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

- **No Telegram API Required**: Automatically crawls public channels via web preview (`t.me/s/:channel`) with backward pagination up to any number of recent messages.
- **Multi-Protocol Support**:
  - `vmess://` (JSON parsed & base64 decoded)
  - `vless://`
  - `trojan://`
  - `ss://` / `ssr://` (Shadowsocks & ShadowsocksR)
  - `hy2://` / `hysteria2://`
  - `tuic://`
  - `wireguard://`
  - Automatic detection of base64-encoded configuration blocks.
- **Advanced Filtering & Deduplication**:
  - Whitelist specific protocols.
  - Smart deduplication based on cryptographic hash of server, port, and credential identity.
  - Optional custom remark templating (`{channel}`, `{protocol}`, `{index}`, `{server}`, `{port}`) while preserving original names by default.
- **Export Options**:
  - **Subscription Links**: Instant generation of standard subscription URLs compatible with v2rayNG, V2RayN, Streisand, and Sing-box.
  - **File Download**: Export raw configurations as `.txt` files.
  - **One-Click Copy**: Copy configurations in raw plaintext or Base64 format.
- **Clean UI**:
  - Light and Dark mode with responsive design.
  - Persian (Vazirmatn) typography.
  - Quick-access saved channels.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
git clone https://github.com/your-username/tg-v2ray-exporter.git
cd tg-v2ray-exporter
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── channels/       # Saved channels management
│   │   ├── export/         # Text file download endpoint
│   │   ├── publish-paste/  # Cloud subscription generator
│   │   ├── scrape/         # Telegram scraping endpoint
│   │   └── sub/[id]/       # Local subscription endpoint
│   ├── globals.css         # Styling, dark mode & Vazirmatn font
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application dashboard
├── components/
│   ├── ChannelForm.tsx     # Channel input, protocol & filter options
│   ├── ConfigCard.tsx      # Config details card & quick copy
│   ├── ExportToolbar.tsx   # Action bar for export & download
│   ├── Navbar.tsx          # Header with theme toggle & links
│   └── SubscriptionModal.tsx # Subscription URL generator & guides
├── lib/
│   ├── parser/             # Protocol parsers & deduplication engine
│   ├── scraper/            # Telegram web crawler
│   └── storage/            # Local JSON store & providers
└── types/                  # TypeScript data models
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
