"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, Bell, CalendarDays, Check, ChevronDown, CircleHelp, Command, Download, Headphones, LayoutDashboard, ListFilter, MessageSquareText, MoreHorizontal, Search, Settings2, Sparkles, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const weeklyActivity = [
  { day: "Mon", volume: 45, positive: 63 }, { day: "Tue", volume: 62, positive: 70 },
  { day: "Wed", volume: 52, positive: 65 }, { day: "Thu", volume: 78, positive: 72 },
  { day: "Fri", volume: 68, positive: 68 }, { day: "Sat", volume: 36, positive: 75 },
  { day: "Sun", volume: 43, positive: 71 },
];

const conversations = [
  { name: "Olivia Rhye", company: "Layers", initials: "OR", tone: "rose", channel: "Phone", time: "10:42 AM", duration: "08:24", sentiment: "Positive", intent: "Product inquiry", summary: "Asked about upgrading her team's plan before renewal." },
  { name: "Phoenix Baker", company: "Sisyphus", initials: "PB", tone: "blue", channel: "Phone", time: "10:18 AM", duration: "12:06", sentiment: "Neutral", intent: "Billing question", summary: "Clarified a duplicate invoice and confirmed next steps." },
  { name: "Lana Steiner", company: "Circooles", initials: "LS", tone: "amber", channel: "Web call", time: "09:56 AM", duration: "06:51", sentiment: "At risk", intent: "Cancellation risk", summary: "Considering cancellation after a delayed onboarding." },
  { name: "Demi Wilkinson", company: "Catalog", initials: "DW", tone: "green", channel: "Phone", time: "09:31 AM", duration: "09:12", sentiment: "Positive", intent: "Technical support", summary: "Resolved an integration issue; customer was satisfied." },
  { name: "Candice Wu", company: "Quotient", initials: "CW", tone: "violet", channel: "Phone", time: "09:04 AM", duration: "04:38", sentiment: "Neutral", intent: "Feature request", summary: "Shared feedback on the reporting workflow." },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Conversations", icon: MessageSquareText },
  { label: "Customers", icon: Users }, { label: "Voice analytics", icon: AudioLines },
];

type Sentiment = "Positive" | "Neutral" | "At risk";

function SentimentPill({ sentiment }: { sentiment: Sentiment }) {
  return <span className={`sentiment sentiment-${sentiment.toLowerCase().replace(" ", "-")}`}>{sentiment}</span>;
}

function MetricChange({ value, positive = true }: { value: string; positive?: boolean }) {
  return <span className={`metric-change ${positive ? "is-positive" : "is-negative"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{value}</span>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [activeRange, setActiveRange] = useState("7 days");
  const [sentimentFilter, setSentimentFilter] = useState("All sentiment");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exported, setExported] = useState(false);
  const filteredConversations = useMemo(() => conversations.filter((item) => {
    const matchesQuery = `${item.name} ${item.company} ${item.intent} ${item.summary}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (sentimentFilter === "All sentiment" || item.sentiment === sentimentFilter);
  }), [query, sentimentFilter]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Signal Desk home"><span className="brand-mark"><AudioLines size={20} strokeWidth={2.5} /></span><span>signal<span className="brand-light">desk</span></span></a>
        <div className="workspace-picker"><span className="workspace-avatar">N</span><span className="workspace-copy"><strong>Northstar Studio</strong><small>Growth workspace</small></span><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === "Conversations" && <span className="nav-count">24</span>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-top"><span className="plan-icon"><Sparkles size={15} /></span><span>AI credits</span><span className="plan-number">72%</span></div><div className="plan-meter"><span /></div><p>1,440 of 2,000 minutes used</p><button onClick={() => setActiveNav("Settings")}>Manage plan <ArrowRight size={14} /></button></div>
          <button className="nav-item"><CircleHelp size={17} /><span>Help center</span></button><button className="nav-item"><Settings2 size={17} /><span>Settings</span></button>
          <div className="profile-row"><span className="profile-avatar">JD</span><span className="workspace-copy"><strong>Jamie Davis</strong><small>Admin</small></span><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="search-box" aria-label="Search workspace"><Search size={16} /><span>Search anything...</span><kbd><Command size={11} /> K</kbd></button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button><span className="top-avatar">JD</span></div></header>
        <div className="dashboard">
          <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> LIVE INTELLIGENCE</div><h1>Good morning, Jamie <span className="wave">✳</span></h1><p>Here&apos;s what&apos;s happening across your conversations today.</p></div><div className="heading-actions"><label className="range-select"><CalendarDays size={16} /><select value={activeRange} onChange={(event) => setActiveRange(event.target.value)} aria-label="Select date range"><option>7 days</option><option>30 days</option><option>90 days</option></select><ChevronDown size={14} /></label><button className={`export-button ${exported ? "exported" : ""}`} onClick={() => { setExported(true); window.setTimeout(() => setExported(false), 1800); }}>{exported ? <Check size={15} /> : <Download size={15} />}{exported ? "Exported" : "Export report"}</button></div></section>

          <section className="metrics-grid" aria-label="Key metrics">
            <article className="metric-card"><div className="metric-heading"><span>Conversations</span><span className="metric-icon metric-icon-coral"><MessageSquareText size={17} /></span></div><div className="metric-value">1,284</div><div className="metric-footer"><MetricChange value="12.8%" /><span>vs. previous period</span></div><div className="sparkline sparkline-coral"><svg viewBox="0 0 150 32" preserveAspectRatio="none"><path d="M0 25 C15 24 16 17 28 20 S42 24 54 15 67 19 77 11 91 16 101 10 119 15 128 6 141 9 150 2" /></svg></div></article>
            <article className="metric-card"><div className="metric-heading"><span>Avg. sentiment</span><span className="metric-icon metric-icon-green"><Sparkles size={17} /></span></div><div className="metric-value">78<span className="metric-unit">/100</span></div><div className="metric-footer"><MetricChange value="4.2 pts" /><span>vs. previous period</span></div><div className="sentiment-strip">{Array.from({ length: 18 }, (_, index) => <span key={index} />)}</div></article>
            <article className="metric-card"><div className="metric-heading"><span>Resolution rate</span><span className="metric-icon metric-icon-blue"><Check size={17} /></span></div><div className="metric-value">86.4<span className="metric-unit">%</span></div><div className="metric-footer"><MetricChange value="2.1%" /><span>vs. previous period</span></div><div className="sparkline sparkline-blue"><svg viewBox="0 0 150 32" preserveAspectRatio="none"><path d="M0 27 C12 20 19 25 30 18 S44 21 54 16 65 20 77 11 92 19 103 12 116 14 126 7 140 12 150 3" /></svg></div></article>
            <article className="metric-card"><div className="metric-heading"><span>At-risk customers</span><span className="metric-icon metric-icon-amber"><Headphones size={17} /></span></div><div className="metric-value">18</div><div className="metric-footer"><MetricChange value="3 fewer" positive={false} /><span>vs. previous period</span></div><div className="risk-note"><span className="risk-dot" /> 6 need follow-up today</div></article>
          </section>

          <section className="charts-grid">
            <article className="panel activity-panel"><div className="panel-heading"><div><h2>Conversation activity</h2><p>Volume and sentiment over time</p></div><button className="more-button" aria-label="More activity options"><MoreHorizontal size={19} /></button></div><div className="chart-legend"><span><i className="legend-volume" /> Conversations</span><span><i className="legend-sentiment" /> Positive sentiment</span><span className="chart-period">This {activeRange}</span></div><div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyActivity} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}><defs><linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e57256" stopOpacity={0.18} /><stop offset="95%" stopColor="#e57256" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#ebe9e4" strokeDasharray="3 5" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#9a9993", fontSize: 11 }} dy={10} /><YAxis yAxisId="volume" tickLine={false} axisLine={false} tick={{ fill: "#9a9993", fontSize: 11 }} ticks={[0, 20, 40, 60, 80]} /><YAxis yAxisId="sentiment" orientation="right" tickLine={false} axisLine={false} tick={{ fill: "#9a9993", fontSize: 11 }} ticks={[0, 25, 50, 75, 100]} /><Tooltip contentStyle={{ border: "1px solid #e9e7e1", borderRadius: 8, fontSize: 12 }} /><Area yAxisId="volume" type="monotone" dataKey="volume" name="Conversations" stroke="#df765d" strokeWidth={2.2} fill="url(#volumeFill)" /><Area yAxisId="sentiment" type="monotone" dataKey="positive" name="Positive sentiment" stroke="#509781" strokeWidth={2} fill="none" /></AreaChart></ResponsiveContainer></div></article>
            <article className="panel insight-panel"><div className="panel-heading"><div><h2>What customers are saying</h2><p>Top themes this week</p></div><span className="ai-tag"><Sparkles size={12} /> AI INSIGHT</span></div><div className="insight-summary"><span className="insight-icon"><Sparkles size={16} /></span><p>Customers are <strong>loving the new team features</strong>, but setup friction is showing up in early conversations.</p></div><div className="theme-list"><div className="theme-row"><span className="theme-rank">01</span><span className="theme-copy"><strong>Easy team collaboration</strong><small>Product praise · 46 mentions</small></span><span className="theme-trend trend-up"><ArrowUpRight size={14} /> 18%</span></div><div className="theme-row"><span className="theme-rank">02</span><span className="theme-copy"><strong>Onboarding takes too long</strong><small>Friction point · 29 mentions</small></span><span className="theme-trend trend-down"><ArrowDownRight size={14} /> 6%</span></div><div className="theme-row"><span className="theme-rank">03</span><span className="theme-copy"><strong>Reporting flexibility</strong><small>Feature request · 21 mentions</small></span><span className="theme-trend trend-up"><ArrowUpRight size={14} /> 12%</span></div></div><button className="text-action" onClick={() => setActiveNav("Voice analytics")}>Explore all insights <ArrowRight size={14} /></button></article>
          </section>

          <section className="panel conversations-panel"><div className="conversation-heading"><div><h2>Recent conversations</h2><p>AI summaries from your latest customer calls</p></div><div className="conversation-controls"><label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" /></label><div className="filter-wrap"><button className={`filter-button ${showFilters ? "filter-active" : ""}`} onClick={() => setShowFilters(!showFilters)}><ListFilter size={15} /> Filter</button>{showFilters && <div className="filter-menu"><span>Sentiment</span>{["All sentiment", "Positive", "Neutral", "At risk"].map((sentiment) => <button key={sentiment} onClick={() => { setSentimentFilter(sentiment); setShowFilters(false); }}>{sentiment}{sentimentFilter === sentiment && <Check size={14} />}</button>)}</div>}</div><button className="view-all-button" onClick={() => setActiveNav("Conversations")}>View all <ArrowRight size={14} /></button></div></div><div className="table-wrap"><table><thead><tr><th>CONTACT</th><th>CHANNEL</th><th>TIME</th><th>SENTIMENT</th><th>TOP INTENT</th><th>AI SUMMARY</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredConversations.map((item) => <tr key={item.name}><td><div className="contact-cell"><span className={`contact-avatar avatar-${item.tone}`}>{item.initials}</span><span><strong>{item.name}</strong><small>{item.company}</small></span></div></td><td><span className="channel-cell"><Headphones size={14} />{item.channel}</span></td><td className="time-cell">{item.time}<small>{item.duration}</small></td><td><SentimentPill sentiment={item.sentiment as Sentiment} /></td><td><span className="intent-cell">{item.intent}</span></td><td><span className="summary-cell">{item.summary}</span></td><td><button className="row-action" aria-label={`Open ${item.name} conversation`}><ArrowRight size={15} /></button></td></tr>)}</tbody></table>{filteredConversations.length === 0 && <div className="empty-state">No conversations match those filters.</div>}</div><div className="table-footer"><span>Showing <strong>{filteredConversations.length}</strong> of 24 conversations</span><button onClick={() => { setQuery(""); setSentimentFilter("All sentiment"); }}>Clear filters</button></div></section>
          <footer className="dashboard-footer"><span><span className="sync-dot" /> Updated just now</span><span>Intelligence by Signal AI <span className="footer-sparkle">✳</span></span></footer>
        </div>
      </main>
    </div>
  );
}
