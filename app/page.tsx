'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface RiskCard {
  icon: string
  label: string
  score: number
  status: 'Low' | 'Medium' | 'High' | 'Critical'
  description: string
}

// ─── Score → color mapping (0-30 green, 31-60 yellow, 61-80 orange, 81-100 red)
function getRiskColor(score: number): { color: string; trackColor: string; glow: string } {
  if (score <= 30) return { color: '#00ff88', trackColor: 'rgba(0,255,136,0.12)', glow: '0 0 20px rgba(0,255,136,0.5)' }
  if (score <= 60) return { color: '#fbbf24', trackColor: 'rgba(251,191,36,0.12)', glow: '0 0 20px rgba(251,191,36,0.5)' }
  if (score <= 80) return { color: '#f97316', trackColor: 'rgba(249,115,22,0.12)', glow: '0 0 20px rgba(249,115,22,0.5)' }
  return { color: '#ef4444', trackColor: 'rgba(239,68,68,0.12)', glow: '0 0 20px rgba(239,68,68,0.6)' }
}

interface Solution {
  icon: string
  title: string
  description: string
  sdg: string
  sdgColor: string
  category: string
}

// ─── Mock data per city ────────────────────────────────────────────────────────
const cityData: Record<string, { risks: RiskCard[]; solutions: Solution[] }> = {
  default: {
    risks: [
      { icon: '💧', label: 'Water Scarcity', score: 72, status: 'High', description: 'Severe groundwater depletion detected' },
      { icon: '🌫️', label: 'Air Pollution', score: 45, status: 'Medium', description: 'AQI elevated due to traffic & industry' },
      { icon: '🚦', label: 'Traffic Congestion', score: 88, status: 'Critical', description: 'Peak hour gridlock across 12 corridors' },
      { icon: '🌊', label: 'Flood Risk', score: 24, status: 'Low', description: 'Moderate drainage capacity maintained' },
    ],
    solutions: [
      { icon: '🌊', title: 'Smart Water Recycling', description: 'Deploy IoT-based greywater recycling systems to reduce municipal water demand by up to 40%, enabling smarter distribution networks.', sdg: 'SDG 6', sdgColor: '#0066ff', category: 'Clean Water' },
      { icon: '🌿', title: 'Green Urban Corridors', description: 'Establish eco-transit lanes, electric mobility hubs, and urban green belts to reduce emissions and improve air quality city-wide.', sdg: 'SDG 11', sdgColor: '#ff6b00', category: 'Sustainable Cities' },
      { icon: '🛡️', title: 'AI Flood Defense Grid', description: 'Real-time flood prediction models integrated with smart drainage systems to reduce flood damage risk by 60% in vulnerable zones.', sdg: 'SDG 13', sdgColor: '#00aa44', category: 'Climate Action' },
    ],
  },
  mumbai: {
    risks: [
      { icon: '💧', label: 'Water Scarcity', score: 55, status: 'Medium', description: 'Seasonal shortages in northern suburbs' },
      { icon: '🌫️', label: 'Air Pollution', score: 78, status: 'High', description: 'PM2.5 levels exceeding WHO limits' },
      { icon: '🚦', label: 'Traffic Congestion', score: 92, status: 'Critical', description: 'Among the worst urban gridlocks globally' },
      { icon: '🌊', label: 'Flood Risk', score: 85, status: 'Critical', description: 'Annual monsoon flooding in low-lying areas' },
    ],
    solutions: [
      { icon: '🌊', title: 'Coastal Flood Barriers', description: 'AI-managed tidal barriers and mangrove restoration to combat rising sea levels and reduce monsoon flood damage significantly.', sdg: 'SDG 13', sdgColor: '#00aa44', category: 'Climate Action' },
      { icon: '🚌', title: 'Metro Expansion AI', description: 'Predictive crowd management for metro lines using computer vision to reduce road congestion by diverting passengers optimally.', sdg: 'SDG 11', sdgColor: '#ff6b00', category: 'Sustainable Cities' },
      { icon: '🌿', title: 'Urban Air Filtration', description: 'Deploy smart air purification towers and vehicular emission monitoring systems across industrial zones and high-traffic areas.', sdg: 'SDG 11', sdgColor: '#ff6b00', category: 'Sustainable Cities' },
    ],
  },
  singapore: {
    risks: [
      { icon: '💧', label: 'Water Scarcity', score: 18, status: 'Low', description: 'Desalination & NEWater ensure resilience' },
      { icon: '🌫️', label: 'Air Pollution', score: 22, status: 'Low', description: 'Clean air initiatives highly effective' },
      { icon: '🚦', label: 'Traffic Congestion', score: 38, status: 'Medium', description: 'ERP system managing peak-hour flows' },
      { icon: '🌊', label: 'Flood Risk', score: 41, status: 'Medium', description: 'Climate change increasing coastal risk' },
    ],
    solutions: [
      { icon: '💡', title: 'Smart Grid Expansion', description: 'Extend AI-optimized energy grids with predictive demand balancing and renewable integration across all 5 planning regions.', sdg: 'SDG 11', sdgColor: '#ff6b00', category: 'Sustainable Cities' },
      { icon: '🌊', title: 'NEWater 2.0 Program', description: 'Upgrade wastewater reclamation to achieve 85% water self-sufficiency, reducing dependency on imported water reserves.', sdg: 'SDG 6', sdgColor: '#0066ff', category: 'Clean Water' },
      { icon: '🛡️', title: 'Coastal Resilience Plan', description: 'Long Beach Road and Marina Bay adaptation using AI tidal modeling and smart polders to future-proof against 1m sea rise.', sdg: 'SDG 13', sdgColor: '#00aa44', category: 'Climate Action' },
    ],
  },
}

// ─── Status badge colors ───────────────────────────────────────────────────────
const statusConfig = {
  Low: { bg: 'rgba(0,255,136,0.15)', text: '#00ff88', border: 'rgba(0,255,136,0.45)', shadow: '0 0 12px rgba(0,255,136,0.4)' },
  Medium: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.45)', shadow: '0 0 12px rgba(251,191,36,0.4)' },
  High: { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: 'rgba(249,115,22,0.45)', shadow: '0 0 12px rgba(249,115,22,0.4)' },
  Critical: { bg: 'rgba(239,68,68,0.2)', text: '#ff3333', border: 'rgba(239,68,68,0.6)', shadow: '0 0 16px rgba(239,68,68,0.6)' },
}

// ─── Circular Gauge Component ──────────────────────────────────────────────────
function CircularGauge({ score, animate }: { score: number; animate: boolean }) {
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const [displayScore, setDisplayScore] = useState(0)
  // offset: circumference = empty ring, 0 = full ring
  const [offset, setOffset] = useState(circumference)
  // ready gates the CSS transition — false means instant (no animation)
  const [ready, setReady] = useState(false)

  const { color, glow } = getRiskColor(displayScore)
  // unique filter id per color so multiple gauges don't share the same filter
  const filterId = `glow-${color.replace(/[^a-z0-9]/gi, '')}`

  useEffect(() => {
    if (!animate) {
      setDisplayScore(0)
      setOffset(circumference)
      setReady(false)
      return
    }

    // Phase 1 — instant reset (transition disabled)
    setReady(false)
    setDisplayScore(0)
    setOffset(circumference)

    // Phase 2 — next paint: enable CSS transition and animate arc to target
    let rafId1: number
    let rafId2: number
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        setReady(true)
        setOffset(circumference - (score / 100) * circumference)
      })
    })

    // Phase 3 — count up number with easeOutCubic over 1.5s
    const duration = 1500
    const startTime = performance.now()
    let countRaf: number
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplayScore(Math.round(eased * score))
      if (t < 1) countRaf = requestAnimationFrame(tick)
    }
    countRaf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId1)
      cancelAnimationFrame(rafId2)
      cancelAnimationFrame(countRaf)
    }
  }, [score, animate])

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <defs>
          {/* Two-layer drop shadow matching ring color */}
          <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.75" />
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor={color} floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Dark background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />

        {/* Thin inner accent ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius - strokeWidth - 4}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.15"
          style={{ transition: 'stroke 0.6s ease' }}
        />

        {/* Progress arc — animated via stroke-dashoffset CSS transition */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={ready ? `url(#${filterId})` : undefined}
          style={{
            transition: ready
              ? 'stroke-dashoffset 1.5s cubic-bezier(0.25,0.46,0.45,0.94), stroke 0.5s ease'
              : 'none',
          }}
        />
      </svg>

      {/* Center score counter */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <span style={{
          color,
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '1.65rem',
          fontWeight: 900,
          lineHeight: 1,
          transition: 'color 0.5s ease',
          textShadow: ready ? glow : 'none',
        }}>
          {displayScore}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '8px', marginTop: 3, letterSpacing: '0.1em' }}>/ 100</span>
      </div>
    </div>
  )
}



// ─── Skeletons ────────────────────────────────────────────────────────────────
function CityProfileCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 mb-8 mt-8"
      style={{
        background: 'linear-gradient(135deg, rgba(10,24,48,0.95), rgba(6,16,34,0.98))',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-48 h-8 rounded animate-shimmer" />
            <div className="w-16 h-5 rounded-full animate-shimmer" />
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-4 rounded animate-shimmer" />
            <div className="w-32 h-4 rounded animate-shimmer" />
            <div className="w-24 h-4 rounded animate-shimmer" />
          </div>
          <div className="space-y-3">
            <div className="w-full h-3 rounded animate-shimmer" />
            <div className="w-[90%] h-3 rounded animate-shimmer" />
            <div className="w-[80%] h-3 rounded animate-shimmer" />
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-8 py-5 rounded-xl w-36 h-36"
             style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-16 h-10 rounded animate-shimmer mb-3" />
          <div className="w-14 h-5 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

function RiskCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col items-center gap-4 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(13,31,60,0.88), rgba(10,22,40,0.92))',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
      }}
    >
      <div className="w-10 h-10 rounded-full animate-shimmer" />
      <div className="w-32 h-4 rounded animate-shimmer mt-2" />
      <div className="w-32 h-32 rounded-full animate-shimmer my-2" />
      <div className="w-16 h-6 rounded-full animate-shimmer mt-2" />
      <div className="w-full h-3 rounded animate-shimmer mt-2" />
      <div className="w-4/5 h-3 rounded animate-shimmer mt-1" />
    </div>
  )
}

// ─── City Profile Card ────────────────────────────────────────────────────────
interface CityProfileProps {
  cityName: string
  country: string
  population: string
  summary: string
  scores: number[]
  analyzedAt: Date
  animate: boolean
}

function CityProfileCard({ cityName, country, population, summary, scores, analyzedAt, animate }: CityProfileProps) {
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const { color, glow } = getRiskColor(overall)
  const overallStatus = overall <= 30 ? 'Low' : overall <= 60 ? 'Medium' : overall <= 80 ? 'High' : 'Critical'
  const sc = statusConfig[overallStatus]

  // Pulse-border animation: active for 2.5s after mount, then off
  const [pulsing, setPulsing] = useState(false)
  useEffect(() => {
    if (!animate) return
    setPulsing(true)
    const t = setTimeout(() => setPulsing(false), 2500)
    return () => clearTimeout(t)
  }, [animate, cityName])

  const timeStr = analyzedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = analyzedAt.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.6s ease, border-color 0.6s ease',
        background: 'linear-gradient(135deg, rgba(10,24,48,0.95) 0%, rgba(6,16,34,0.98) 100%)',
        border: pulsing ? `1px solid rgba(0,255,136,0.8)` : `1px solid rgba(0,255,136,0.18)`,
        boxShadow: pulsing
          ? '0 0 30px rgba(0,255,136,0.25), 0 0 60px rgba(0,255,136,0.1), 0 8px 32px rgba(0,0,0,0.5)'
          : '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">

        {/* Left — city name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="font-black truncate" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', color: '#e2e8f0' }}>
              {cityName}
            </h2>
            <span className="text-sm font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)', fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              {country}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              👥 <span style={{ color: 'rgba(255,255,255,0.7)' }}>{population}</span>
            </span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              🤖 Gemini AI · Google Search
            </span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              🕐 {timeStr} · {dateStr}
            </span>
          </div>

          {summary && (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '65ch' }}>
              {summary}
            </p>
          )}
        </div>

        {/* Right — overall risk score */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-8 py-5 rounded-xl"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${color}30`,
            minWidth: 140,
          }}>
          <p className="text-xs mb-1 tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Orbitron, sans-serif' }}>
            OVERALL RISK
          </p>
          <span className="font-black leading-none mb-2" style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '3rem',
            color,
            textShadow: glow,
          }}>
            {overall}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full tracking-wider" style={{
            background: sc.bg,
            color: sc.text,
            border: `1px solid ${sc.border}`,
            fontFamily: 'Orbitron, sans-serif',
          }}>
            {overallStatus}
          </span>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>avg of 4 risks</p>
        </div>

      </div>
    </div>
  )
}

// ─── Risk Comparison Bar Chart ────────────────────────────────────────────────
function RiskComparisonChart({ risks, animate }: { risks: RiskCard[]; animate: boolean }) {
  const [widths, setWidths] = useState<number[]>(risks.map(() => 0))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Phase 1 — instant reset
    setReady(false)
    setWidths(risks.map(() => 0))

    if (!animate) return

    // Phase 2 — next two frames: enable CSS transition then set target widths
    let r1: number
    let r2: number
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setReady(true)
        setWidths(risks.map(r => r.score))
      })
    })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [animate, risks.map(r => r.score).join(',')])

  const BAR_HEIGHT = 36
  const GAP = 16
  const LABEL_W = 160
  const SCORE_W = 42
  const svgH = risks.length * (BAR_HEIGHT + GAP) - GAP + 8

  return (
    <div className="mt-8 rounded-2xl p-6"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s',
        background: 'linear-gradient(135deg, rgba(10,24,48,0.92), rgba(6,16,34,0.96))',
        border: '1px solid rgba(0,255,136,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Orbitron, sans-serif' }}>RISK COMPARISON OVERVIEW</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>All four indicators side by side</p>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {[{ label: 'Low', c: '#00ff88' }, { label: 'Medium', c: '#fbbf24' }, { label: 'High', c: '#f97316' }, { label: 'Critical', c: '#ef4444' }].map(({ label, c }) => (
            <span key={label} className="flex items-center gap-1">
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* SVG bars — width wraps available space */}
      <div style={{ width: '100%' }}>
        {risks.map((risk, i) => {
          const { color, glow } = getRiskColor(risk.score)
          const targetPct = widths[i] ?? 0
          const y = i * (BAR_HEIGHT + GAP)
          return (
            <div key={risk.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < risks.length - 1 ? GAP : 0 }}>
              {/* Label */}
              <div style={{ width: LABEL_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{risk.icon}</span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', lineHeight: 1.2 }}>{risk.label}</span>
              </div>

              {/* Track + filled bar */}
              <div style={{ flex: 1, position: 'relative', height: BAR_HEIGHT, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                {/* Filled bar */}
                <div style={{
                  position: 'absolute', inset: 0,
                  width: `${targetPct}%`,
                  background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
                  borderRadius: 8,
                  boxShadow: ready ? `0 0 12px ${color}55` : 'none',
                  transition: ready
                    ? `width 1.5s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.12}s, box-shadow 0.5s ease`
                    : 'none',
                }} />
                {/* Score inside bar (right-aligned) */}
                {targetPct > 18 && (
                  <div style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 900,
                    color: 'rgba(0,0,0,0.85)',
                    opacity: ready ? 1 : 0,
                    transition: ready ? `opacity 0.4s ease ${i * 0.12 + 0.8}s` : 'none',
                  }}>{risk.score}</div>
                )}
              </div>

              {/* Score outside (for low scores) */}
              <div style={{ width: SCORE_W, flexShrink: 0, textAlign: 'right', fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', fontWeight: 700, color, textShadow: ready ? glow : 'none' }}>
                {risk.score}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Risk Card Component ───────────────────────────────────────────────────────

function RiskCardComponent({ card, index, animate }: { card: RiskCard; index: number; animate: boolean }) {
  const sc = statusConfig[card.status]
  const { color, glow } = getRiskColor(card.score)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl p-6 flex flex-col items-center gap-4 cursor-default"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? (hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)') : 'translateY(24px) scale(0.97)',
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)`,
        background: hovered
          ? `linear-gradient(135deg, rgba(13,31,60,0.97), rgba(10,22,40,0.99))`
          : 'linear-gradient(135deg, rgba(13,31,60,0.88), rgba(10,22,40,0.92))',
        border: hovered ? `1px solid ${color}` : '1px solid rgba(0,255,136,0.15)',
        boxShadow: hovered
          ? `0 0 40px ${color}30, 0 0 80px ${color}10, 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px ${color}08`
          : '0 0 20px rgba(0,255,136,0.04)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-4xl animate-float" style={{ animationDelay: `${index * 0.4}s` }}>{card.icon}</div>
      <h3 className="text-sm font-semibold text-center" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>{card.label}</h3>
      <CircularGauge score={card.score} animate={animate} />
      <div className="flex flex-col items-center gap-2 w-full">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
          style={{
            background: sc.bg,
            color: sc.text,
            border: `1px solid ${sc.border}`,
            fontFamily: 'Orbitron, sans-serif',
            textShadow: sc.shadow,
            boxShadow: hovered ? sc.shadow : 'none',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {card.status.toUpperCase()}
        </span>
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{card.description}</p>
      </div>
    </div>
  )
}

// ─── Solution Card Component ───────────────────────────────────────────────────
const SDG_BORDER: Record<string, string> = {
  'SDG 6': '#0099cc',
  'SDG 11': '#ff8c00',
  'SDG 13': '#2d8a4e',
  'SDG 3': '#4cba4b',
  'SDG 7': '#fcc30b',
  'SDG 15': '#56c02b',
}

function SolutionCard({ sol, index, animate }: { sol: Solution; index: number; animate: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [badgeVisible, setBadgeVisible] = useState(false)
  const borderColor = SDG_BORDER[sol.sdg] ?? '#00ff88'

  // Badge pops in 600ms after the card itself fades in
  useEffect(() => {
    if (!animate) { setBadgeVisible(false); return }
    const t = setTimeout(() => setBadgeVisible(true), 600 + index * 150)
    return () => clearTimeout(t)
  }, [animate, index])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl flex flex-col gap-4 cursor-default overflow-hidden relative"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate
          ? (hovered ? 'translateY(-8px) scale(1.025)' : 'translateY(0) scale(1)')
          : 'translateY(24px) scale(0.97)',
        transition: `opacity 0.6s ease ${0.2 + index * 0.15}s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)`,
        background: 'linear-gradient(135deg, rgba(10,22,42,0.96), rgba(6,14,30,0.98))',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: hovered
          ? `0 0 30px ${borderColor}22, 0 20px 50px rgba(0,0,0,0.55), -4px 0 20px ${borderColor}30`
          : `0 4px 20px rgba(0,0,0,0.35), -2px 0 12px ${borderColor}18`,
        backdropFilter: 'blur(14px)',
        padding: '1.5rem',
      }}
    >
      {/* SDG watermark */}
      <div style={{
        position: 'absolute', right: 12, bottom: 8,
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '5rem', fontWeight: 900,
        color: borderColor,
        opacity: hovered ? 0.12 : 0.06,
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'opacity 0.35s ease',
        letterSpacing: '-0.05em',
      }}>
        {sol.sdg.replace('SDG ', '')}
      </div>

      {/* "✓ Actionable" badge — top-right corner */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        opacity: badgeVisible ? 1 : 0,
        transform: badgeVisible ? 'scale(1)' : 'scale(0.6)',
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#00ff88',
          background: 'rgba(0,255,136,0.1)',
          border: '1px solid rgba(0,255,136,0.35)',
          borderRadius: 999,
          padding: '2px 8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}>
          ✓ Actionable
        </span>
      </div>

      {/* Icon with bounce animation */}
      <div style={{
        fontSize: '2.5rem',
        lineHeight: 1,
        display: 'inline-block',
        animation: animate ? `iconBounce 0.7s cubic-bezier(0.22,1,0.36,1) ${0.25 + index * 0.15}s both` : 'none',
      }}>
        {sol.icon}
      </div>

      {/* Title + category */}
      <div>
        <h3 className="font-bold mb-1.5" style={{
          color: '#e2e8f0',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.88rem',
          lineHeight: 1.3,
          letterSpacing: '0.03em',
          paddingRight: '3rem', // avoid overlap with badge
        }}>
          {sol.title}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded" style={{
          background: `${borderColor}18`,
          color: borderColor,
          border: `1px solid ${borderColor}40`,
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.62rem',
          letterSpacing: '0.06em',
        }}>
          {sol.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
        {sol.description}
      </p>

      {/* Footer: SDG tag + Learn More */}
      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest"
          style={{
            background: `${sol.sdgColor ?? borderColor}1a`,
            color: sol.sdgColor ?? borderColor,
            border: `1px solid ${sol.sdgColor ?? borderColor}44`,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.62rem',
          }}
        >
          🌐 {sol.sdg}
        </span>

        {/* Learn More — visible on hover */}
        <span style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: borderColor,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          Learn More →
        </span>
      </div>
    </div>
  )
}

// ─── Floating particles / Stars ───────────────────────────────────────────────
function Particles() {
  const [stars, setStars] = useState<Array<{
    id: number; left: number; top: number; size: number; delay: number; duration: number;
  }>>([])

  useEffect(() => {
    setStars(Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    })))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {stars.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.id % 4 === 0 ? '#00ff88' : p.id % 4 === 1 ? '#00d4ff' : '#ffffff',
            opacity: 0.6,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite, pulseGlow ${p.duration * 1.5}s ease-in-out ${p.delay}s infinite`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  )
}

// ─── AI Response Types ─────────────────────────────────────────────────────────
interface AIRisk {
  score: number
  level: 'Low' | 'Medium' | 'High' | 'Critical'
  reason: string
}

interface AIData {
  city: string
  country: string
  population: string
  risks: {
    waterScarcity: AIRisk
    airPollution: AIRisk
    trafficCongestion: AIRisk
    floodRisk: AIRisk
  }
  solutions: Array<{
    title: string
    description: string
    sdg: string
    icon: string
    category: string
  }>
  summary: string
}

interface RecentCity {
  city: string
  country: string
  overallScore: number
  data: AIData
}

// ─── Loading Overlay Removed (Using Inline Skeletons instead) ─────────────────

// ─── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="max-w-2xl mx-auto mb-6 px-5 py-4 rounded-2xl flex items-start gap-4"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', backdropFilter: 'blur(10px)' }}>
      <span className="text-2xl flex-shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold mb-0.5" style={{ color: '#ef4444' }}>Analysis Failed</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{message}</p>
      </div>
      <button onClick={onDismiss} className="text-xs px-3 py-1 rounded-lg flex-shrink-0"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
        Dismiss
      </button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const fullTitle = "EarthTwin AI"
  const [titleText, setTitleText] = useState("")

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setTitleText(fullTitle.substring(0, i))
      i++
      if (i > fullTitle.length) clearInterval(timer)
    }, 120)
    return () => clearInterval(timer)
  }, [])

  const [city, setCity] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState(cityData.default)
  const [aiMeta, setAiMeta] = useState<{ country: string; population: string; summary: string } | null>(null)
  const [currentCity, setCurrentCity] = useState('Global Average')
  const [animateCards, setAnimateCards] = useState(false)
  const [isAiData, setIsAiData] = useState(false)
  const [analyzedAt, setAnalyzedAt] = useState<Date>(new Date())
  const [loadingStatus, setLoadingStatus] = useState('')
  const [recentCities, setRecentCities] = useState<RecentCity[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Map AI response → internal RiskCard / Solution shape ──
  const mapAiData = (ai: AIData) => {
    const sdgColors: Record<string, string> = {
      'SDG 6': '#0066ff', 'SDG 11': '#ff6b00', 'SDG 13': '#00aa44',
      'SDG 3': '#4cba4b', 'SDG 7': '#fcc30b', 'SDG 15': '#56c02b',
    }
    const risks: RiskCard[] = [
      { icon: '💧', label: 'Water Scarcity', score: ai.risks.waterScarcity.score, status: ai.risks.waterScarcity.level, description: ai.risks.waterScarcity.reason },
      { icon: '🌫️', label: 'Air Pollution', score: ai.risks.airPollution.score, status: ai.risks.airPollution.level, description: ai.risks.airPollution.reason },
      { icon: '🚦', label: 'Traffic Congestion', score: ai.risks.trafficCongestion.score, status: ai.risks.trafficCongestion.level, description: ai.risks.trafficCongestion.reason },
      { icon: '🌊', label: 'Flood Risk', score: ai.risks.floodRisk.score, status: ai.risks.floodRisk.level, description: ai.risks.floodRisk.reason },
    ]
    const solutions: Solution[] = ai.solutions.map(s => ({
      icon: s.icon,
      title: s.title,
      description: s.description,
      sdg: s.sdg,
      sdgColor: sdgColors[s.sdg] ?? '#00aa44',
      category: s.category,
    }))
    return { risks, solutions }
  }

  const handleAnalyze = async () => {
    if (!city.trim()) return
    setAnalyzing(true)
    setAnimateCards(false)
    setError(null)
    setIsAiData(false)

    setLoadingStatus('🔍 Searching web for real-time data...')
    const phase2Timer = setTimeout(() => {
      setLoadingStatus('🧠 AI analyzing sustainability risks...')
    }, 2800)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName: city.trim() }),
      })

      const json = await res.json()

      clearTimeout(phase2Timer)
      if (!res.ok || json.error) {
        setError(json.error ?? 'Analysis failed. Please try again.')
        setAnalyzing(false)
        setLoadingStatus('')
        return
      }

      setLoadingStatus('✅ Analysis complete!')
      setTimeout(() => setLoadingStatus(''), 2500)

      const ai: AIData = json.data
      const mapped = mapAiData(ai)
      
      const score = Math.round(
        [ai.risks.waterScarcity.score, ai.risks.airPollution.score, ai.risks.trafficCongestion.score, ai.risks.floodRisk.score].reduce((a, b) => a + b, 0) / 4
      )
      
      setRecentCities(prev => {
        const filtered = prev.filter(rc => rc.city.toLowerCase() !== ai.city.toLowerCase())
        return [{ city: ai.city, country: ai.country, overallScore: score, data: ai }, ...filtered].slice(0, 5)
      })

      setCurrentData(mapped)
      setCurrentCity(ai.city)
      setAiMeta({ country: ai.country, population: ai.population, summary: ai.summary })
      setAnalyzedAt(new Date())
      setIsAiData(true)
      setAnalyzed(true)
      setTimeout(() => setAnimateCards(true), 100)
    } catch (e) {
      setError('Network error. Make sure the dev server is running and your GEMINI_API_KEY is set in .env.local.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  const handleLoadRecent = (rc: RecentCity) => {
    setAnalyzing(true)
    setAnimateCards(false)
    setError(null)
    setLoadingStatus('⚡ Restoring cached analysis...')
    
    setTimeout(() => {
      const mapped = mapAiData(rc.data)
      setCurrentData(mapped)
      setCurrentCity(rc.data.city)
      setCity(rc.data.city)
      setAiMeta({ country: rc.data.country, population: rc.data.population, summary: rc.data.summary })
      setAnalyzedAt(new Date())
      setIsAiData(true)
      setAnalyzed(true)
      setAnalyzing(false)
      setLoadingStatus('')
      setTimeout(() => setAnimateCards(true), 100)
    }, 400)
  }

  const handleShare = () => {
    if (!currentData || !aiMeta) return
    const highestRisk = currentData.risks.reduce((prev, curr) => (curr.score > prev.score ? curr : prev))
    const overall = Math.round(currentData.risks.reduce((a, b) => a + b.score, 0) / currentData.risks.length)
    const text = `🌍 EarthTwin AI analyzed ${currentCity}: Overall Risk ${overall}/100. Top risk: ${highestRisk.label} (${highestRisk.score}/100 - ${highestRisk.status}).\n\n#SustainableCities #SDG #EarthTwinAI`
    navigator.clipboard.writeText(text)
    setLoadingStatus('🔗 Copied to clipboard!')
    setTimeout(() => setLoadingStatus(''), 2500)
  }

  // Show default cards on first load
  useEffect(() => {
    setTimeout(() => setAnimateCards(true), 500)
    setAnalyzed(true)
  }, [])

  return (
    <main className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #020b18 0%, #050d1a 50%, #020b18 100%)' }}>
      
      {/* Floating Status Indicator */}
      {loadingStatus && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up transition-opacity duration-300">
          <div className="px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl"
               style={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(0,255,136,0.3)', backdropFilter: 'blur(12px)' }}>
            {loadingStatus !== '✅ Analysis complete!' && (
              <div className="w-3 h-3 rounded-full border-2 border-green-400 border-t-transparent" style={{ animation: 'spin-slow 0.8s linear infinite' }} />
            )}
            <span className="text-sm font-semibold tracking-wide" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
              {loadingStatus}
            </span>
          </div>
        </div>
      )}

      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Grid background */}
      <div className="grid-bg fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Particles */}
      <Particles />

      {/* Glow orbs */}
      <div className="fixed pointer-events-none" style={{ zIndex: 0, top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="fixed pointer-events-none" style={{ zIndex: 0, bottom: '-20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.4)' }}>
              🌍
            </div>
            <span className="font-bold text-sm tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ff88', textShadow: '0 0 10px rgba(0,255,136,0.5)' }}>
              EARTH<span style={{ color: '#00d4ff' }}>TWIN</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            {['Dashboard', 'Cities', 'Reports', 'SDGs'].map(item => (
              <button key={item} className="text-xs tracking-widest transition-colors hover:text-green-400"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Orbitron, sans-serif' }}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,212,255,0.08))',
              border: '1px solid rgba(0,255,136,0.3)',
              boxShadow: '0 0 20px rgba(0,255,136,0.15), inset 0 0 10px rgba(0,255,136,0.05)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}>
            <span className="text-sm">🌍</span>
            <span className="text-xs font-bold tracking-widest" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 8px rgba(0,255,136,0.6)' }}>Live AI Analysis</span>
            <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88', animation: 'pulseGlow 1s ease-in-out infinite' }} />
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="text-center mb-16 animate-fade-in-up" style={{ position: 'relative' }}>
          {/* Hero map/grid overlay */}
          <div style={{
            position: 'absolute', inset: '-40px -60px',
            backgroundImage: `
              linear-gradient(rgba(0,255,136,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,136,0.06) 1px, transparent 1px),
              linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px',
            borderRadius: '24px',
            pointerEvents: 'none',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          }} />
          {/* Horizon line glow */}
          <div style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.3), rgba(0,212,255,0.3), transparent)',
            pointerEvents: 'none',
          }} />
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
            <span className="text-xs" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
              ⚡ POWERED BY GEMINI 2.0 · REAL-TIME WEB SEARCH
            </span>
          </div>

          {/* Main title */}
          <h1 className="font-black mb-4 leading-tight flex flex-col items-center justify-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <div className="inline-block relative">
              <span className="gradient-text pr-1.5 border-r-4" 
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', display: 'inline-block', minHeight: '1.2em', borderColor: '#00ff88', animation: 'blink-caret 0.8s step-end infinite' }}>
                {titleText}
              </span>
            </div>
            <span className="block mt-2 animate-fade-in-up" 
                  style={{ animationDelay: '1.5s', opacity: 0, animationFillMode: 'forwards', fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.6)', fontWeight: 400, letterSpacing: '0.2em' }}>
              DIGITAL TWIN FOR SUSTAINABLE CITIES
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base mb-10" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, fontSize: '1rem' }}>
            AI-powered sustainability risk analysis for any city — monitor water scarcity, air quality, traffic, and flood risk in real time with precision intelligence.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mb-12">
            {[
              { label: 'Cities Analyzed', value: '2,847' },
              { label: 'Risk Indicators', value: '124' },
              { label: 'SDG Goals Tracked', value: '17' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEARCH ───────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto mb-6">
          <div className="search-glow rounded-2xl overflow-hidden transition-all duration-300"
            style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,255,136,0.25)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-4 p-2 pl-5">
              {/* Icon */}
              <svg className="flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="rgba(0,255,136,0.6)" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="rgba(0,255,136,0.6)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search any city — Mumbai, Singapore, Lagos..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#e2e8f0', caretColor: '#00ff88' }}
              />
              {/* Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !city.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
                style={{
                  background: analyzing
                    ? 'rgba(0,255,136,0.08)'
                    : 'linear-gradient(135deg, #00ff88 0%, #00e077 50%, #00cc6a 100%)',
                  color: analyzing ? '#00ff88' : '#020b18',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '0.05em',
                  animation: analyzing ? 'none' : 'buttonPulse 2s ease-in-out infinite',
                  transition: 'background 0.3s, color 0.3s, opacity 0.3s',
                  flexShrink: 0,
                }}
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent" style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    Analyze City
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Powered by Gemini 2.0 Flash · Google Search grounding · Real data, not mock
          </p>
        </section>

        {/* ── RECENT CITIES ────────────────────────────────────────────── */}
        {recentCities.length > 0 && !analyzing && (
          <section className="max-w-2xl mx-auto mb-10 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Orbitron, sans-serif' }}>
                RECENTLY ANALYZED
              </span>
              <button 
                onClick={() => setRecentCities([])}
                className="text-xs hover:text-red-400 transition-colors" 
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Orbitron, sans-serif' }}
              >
                Clear History
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {recentCities.map((rc, i) => {
                const { color, glow } = getRiskColor(rc.overallScore)
                return (
                  <button
                    key={rc.city}
                    onClick={() => handleLoadRecent(rc)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                    style={{ 
                      background: 'rgba(13,31,60,0.6)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: `0 4px 12px rgba(0,0,0,0.2)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color
                      e.currentTarget.style.boxShadow = `0 4px 15px ${color}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.2)`
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#e2e8f0' }}>
                      <span className="truncate max-w-[120px]">{rc.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: glow }} />
                      <span className="font-bold text-xs" style={{ fontFamily: 'Orbitron, sans-serif', color }}>
                        {rc.overallScore}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── ERROR BANNER ─────────────────────────────────────────────── */}
        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        )}

        {/* ── RISK CARDS ───────────────────────────────────────────────── */}
        {(analyzed || analyzing) && (
          <section className="mb-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}>
                  RISK ASSESSMENT
                </h2>
                {!analyzing && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm" style={{ color: 'rgba(0,255,136,0.7)' }}>
                      📍 {currentCity}{aiMeta ? `, ${aiMeta.country}` : ''}
                    </p>
                    {aiMeta && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                        👥 {aiMeta.population}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAiData && !analyzing && (
                  <span className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
                    🤖 Gemini AI
                  </span>
                )}
                {!analyzing && (
                  <div className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Orbitron, sans-serif' }}>
                    Updated just now
                  </div>
                )}
              </div>
            </div>

            {/* City Profile Card or Skeleton */}
            {analyzing ? (
              <CityProfileCardSkeleton />
            ) : isAiData && aiMeta && (
              <CityProfileCard
                cityName={currentCity}
                country={aiMeta.country}
                population={aiMeta.population}
                summary={aiMeta.summary}
                scores={currentData.risks.map(r => r.score)}
                analyzedAt={analyzedAt}
                animate={animateCards}
              />
            )}

            {/* 4-card grid or Skeletons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {analyzing ? (
                Array.from({ length: 4 }).map((_, i) => <RiskCardSkeleton key={i} />)
              ) : (
                currentData.risks.map((card, i) => (
                  <RiskCardComponent key={`${currentCity}-${i}`} card={card} index={i} animate={animateCards} />
                ))
              )}
            </div>

            {/* ── RISK COMPARISON BAR CHART ──────────────────────────── */}
            {!analyzing && <RiskComparisonChart risks={currentData.risks} animate={animateCards} />}
          </section>
        )}

        {/* ── AI SUMMARY ───────────────────────────────────────────────── */}
        {isAiData && aiMeta?.summary && (
          <div className="mb-12 px-6 py-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(0,255,136,0.04))', border: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(10px)' }}>
            <span className="text-2xl flex-shrink-0 mt-0.5">🤖</span>
            <div className="flex-1">
              <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: '#00d4ff', fontFamily: 'Orbitron, sans-serif' }}>AI SUSTAINABILITY SUMMARY</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{aiMeta.summary}</p>
            </div>
            <button 
              onClick={handleShare}
              className="mt-2 md:mt-0 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(0,255,136,0.1)',
                color: '#00ff88',
                border: '1px solid rgba(0,255,136,0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}
            >
              <span>🔗</span> Share Results
            </button>
          </div>
        )}

        {/* ── SOLUTIONS ────────────────────────────────────────────────── */}
        {analyzed && (
          <section className="mb-16">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-8">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}>
                  SUGGESTED SOLUTIONS
                </h2>
                <p className="text-sm" style={{ color: 'rgba(0,212,255,0.7)' }}>
                  {isAiData ? '🤖 Gemini AI recommendations tailored for ' + currentCity : '🤖 AI-generated recommendations'} · Aligned with UN SDGs
                </p>
              </div>
            </div>

            {/* 3-card grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {currentData.solutions.map((sol, i) => (
                <SolutionCard key={`${currentCity}-sol-${i}`} sol={sol} index={i} animate={animateCards} />
              ))}
            </div>
          </section>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer className="text-center py-8 border-t px-4" style={{ borderColor: 'rgba(0,255,136,0.1)' }}>
          <p className="text-xs break-words" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
            © {new Date().getFullYear()} EARTHTWIN AI · SUSTAINABLE CITIES · ALL RIGHTS RESERVED
          </p>
          <p className="text-xs mt-3 flex flex-wrap justify-center items-center gap-x-2 gap-y-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
            <span>Powered by Gemini & Claude AI</span>
            <span className="hidden sm:inline">·</span>
            <span>SDG 6</span>
            <span className="hidden sm:inline">·</span>
            <span>SDG 11</span>
            <span className="hidden sm:inline">·</span>
            <span>SDG 13</span>
            <span className="hidden sm:inline">·</span>
            <span>Built with Vibe Coding</span>
          </p>
        </footer>
      </div>
    </main>
  )
}


