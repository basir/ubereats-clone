"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { useTheme } from "next-themes";
import {
  MOCK_DATA,
  MAP_CENTER_LOC,
  ARC_LIFETIME_MS,
  ARC_DRAW_DURATION_MS,
  ARC_FADE_DURATION_MS,
  PULSE_DURATION_MS,
} from "@/lib/mockConfig";
import { MOCK_RESTAURANTS } from "@/lib/mockData";
import { useMockOrders } from "@/lib/useMockOrders";
import type { Order } from "@/lib/api";

const MAP_ZOOM = 14;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatLng {
  latitude: number;
  longitude: number;
}

interface ArcEntry {
  id: string;
  from: LatLng;
  to: LatLng;
  restaurantName: string;
  total: number;
  createdAt: number;
}

interface PulseEntry {
  id: string;
  restaurantId: string;
  createdAt: number;
}

interface ToastEntry {
  id: string;
  restaurantName: string;
  userName: string;
  total: number;
  items: number;
}

// ─── Map styles ───────────────────────────────────────────────────────────────

const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a2035" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a57" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1b2836" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#122214" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
];

const LIGHT_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e8f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dddddd" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffd980" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c5e8c5" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

// ─── SVG Arc Overlay ──────────────────────────────────────────────────────────

function latLngToPoint(
  map: google.maps.Map,
  lat: number,
  lng: number
): { x: number; y: number } | null {
  const proj = map.getProjection();
  const bounds = map.getBounds();
  if (!proj || !bounds) return null;
  const topRight = proj.fromLatLngToPoint(bounds.getNorthEast())!;
  const bottomLeft = proj.fromLatLngToPoint(bounds.getSouthWest())!;
  const scale = Math.pow(2, map.getZoom() ?? MAP_ZOOM);
  const worldPoint = proj.fromLatLngToPoint(new google.maps.LatLng(lat, lng))!;
  return {
    x: (worldPoint.x - bottomLeft.x) * scale,
    y: (worldPoint.y - topRight.y) * scale,
  };
}

function ArcOverlay({ arcs, isDark }: { arcs: ArcEntry[]; isDark: boolean }) {
  const map = useMap();
  const [, forceUpdate] = useState(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("bounds_changed", () => forceUpdate((n) => n + 1));
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  useEffect(() => {
    const tick = () => {
      forceUpdate((n) => n + 1);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  if (!map) return null;
  const div = map.getDiv();
  const W = div.offsetWidth;
  const H = div.offsetHeight;
  const now = Date.now();

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: W, height: H, pointerEvents: "none", zIndex: 10, overflow: "visible" }}
    >
      <defs>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-gray" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {arcs.map((arc) => {
        const from = latLngToPoint(map, arc.from.latitude, arc.from.longitude);
        const to = latLngToPoint(map, arc.to.latitude, arc.to.longitude);
        if (!from || !to) return null;

        const age = now - arc.createdAt;
        const drawProgress = Math.min(1, age / ARC_DRAW_DURATION_MS);
        const fadeProgress = Math.max(0, Math.min(1, (age - ARC_DRAW_DURATION_MS) / ARC_FADE_DURATION_MS));

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return null;
        const bow = Math.min(len * 0.35, 80);
        const cx = mx - (dy / len) * bow;
        const cy = my + (dx / len) * bow;
        const pathD = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
        const approxLen = len * 1.2;

        // dark: green(34,197,94) → gray(107,114,128)
        // light: green(22,163,74) → slate-blue(148,163,184)  — lighter, softer
        const [startR, startG, startB] = isDark ? [34, 197, 94] : [22, 163, 74];
        const [endR, endG, endB] = isDark ? [107, 114, 128] : [148, 163, 184];
        const r = Math.round(startR + (endR - startR) * fadeProgress);
        const g = Math.round(startG + (endG - startG) * fadeProgress);
        const b = Math.round(startB + (endB - startB) * fadeProgress);
        const color = `rgb(${r},${g},${b})`;
        const shadowStroke = isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)";
        const opacity = age > ARC_LIFETIME_MS * 0.8
          ? 1 - (age - ARC_LIFETIME_MS * 0.8) / (ARC_LIFETIME_MS * 0.2)
          : 1;
        const dashOffset = approxLen * (1 - drawProgress);
        const filter = fadeProgress < 0.5 ? "url(#glow-green)" : "url(#glow-gray)";

        const t = drawProgress;
        const bx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * to.x;
        const by = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * to.y;

        const userImgSize = 32;
        const userImgOffset = userImgSize / 2;

        return (
          <g key={arc.id} opacity={Math.max(0, opacity)}>
            <path d={pathD} fill="none" stroke={shadowStroke} strokeWidth={5} strokeLinecap="round" strokeDasharray={approxLen} strokeDashoffset={dashOffset} />
            <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" filter={filter} strokeDasharray={approxLen} strokeDashoffset={dashOffset} />
            {drawProgress < 1 && <circle cx={bx} cy={by} r={5} fill={color} filter={filter} opacity={0.9} />}
            <image
              href="/user.png"
              x={to.x - userImgOffset}
              y={to.y - userImgOffset}
              width={userImgSize}
              height={userImgSize}
              style={{ borderRadius: "50%" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Restaurant Marker ────────────────────────────────────────────────────────

function RestaurantMarker({
  restaurant,
  isPulsing,
  orderCount,
  isDark,
}: {
  restaurant: (typeof MOCK_RESTAURANTS)[number];
  isPulsing: boolean;
  orderCount: number;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <AdvancedMarker
      position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
      zIndex={isPulsing ? 100 : 10}
    >
      <div
        style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isPulsing && (
          <>
            <div style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "rgba(34,197,94,0.35)", animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }} />
            <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "rgba(34,197,94,0.2)", animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite 0.3s" }} />
          </>
        )}

        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: isPulsing
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : isDark ? "linear-gradient(135deg,#1e293b,#0f172a)" : "linear-gradient(135deg,#ffffff,#f1f5f9)",
          border: isPulsing ? "2.5px solid #22c55e" : isDark ? "2.5px solid #334155" : "2.5px solid #e2e8f0",
          boxShadow: isPulsing
            ? "0 0 16px rgba(34,197,94,0.7),0 2px 8px rgba(0,0,0,0.4)"
            : isDark ? "0 2px 8px rgba(0,0,0,0.5)" : "0 2px 10px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={restaurant.cuisineIcon} alt={restaurant.cuisineType} width={28} height={28} style={{ objectFit: "contain" }} />
        </div>

        {orderCount > 0 && (
          <div style={{
            position: "absolute", top: -6, right: -6,
            background: "#22c55e", color: "#fff", borderRadius: "9999px",
            fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
            border: `2px solid ${isDark ? "#0f172a" : "#ffffff"}`,
            boxShadow: "0 0 6px rgba(34,197,94,0.6)",
          }}>
            {orderCount}
          </div>
        )}

        {hovered && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
            transform: "translateX(-50%)",
            background: isDark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            border: isDark ? "1px solid rgba(51,65,85,0.8)" : "1px solid rgba(226,232,240,0.9)",
            borderRadius: 10, padding: "10px 14px", whiteSpace: "nowrap",
            zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", pointerEvents: "none",
          }}>
            <div style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontWeight: 700, fontSize: 13 }}>{restaurant.name}</div>
            <div style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 11, marginTop: 2 }}>{restaurant.cuisineType}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 11 }}>
              <span style={{ color: "#f59e0b" }}>★ {restaurant.rating}</span>
              <span style={{ color: "#94a3b8" }}>·</span>
              <span style={{ color: isDark ? "#94a3b8" : "#475569" }}>{restaurant.deliveryTimeEst} min</span>
              <span style={{ color: "#94a3b8" }}>·</span>
              <span style={{ color: isDark ? "#94a3b8" : "#475569" }}>${restaurant.deliveryFee} fee</span>
            </div>
            <div style={{
              position: "absolute", bottom: -5, left: "50%",
              transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10,
              background: isDark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)",
              border: isDark ? "1px solid rgba(51,65,85,0.8)" : "1px solid rgba(226,232,240,0.9)",
              borderTop: "none", borderLeft: "none",
            }} />
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}

// ─── Stats HUD ────────────────────────────────────────────────────────────────

function StatsHUD({ totalOrders, recentOrders, isDark }: { totalOrders: number; recentOrders: number; isDark: boolean }) {
  const bg = isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(34,197,94,0.3)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";
  const valueColor = isDark ? "#f1f5f9" : "#0f172a";
  const divider = isDark ? "rgba(51,65,85,0.8)" : "rgba(226,232,240,0.8)";

  return (
    <div style={{ position: "absolute", top: 16, left: 16, zIndex: 50, background: bg, backdropFilter: "blur(16px)", border, borderRadius: 14, padding: "14px 18px", minWidth: 210, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse-dot 2s ease-in-out infinite" }} />
        <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Operations</span>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <div>
          <div style={{ color: valueColor, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{totalOrders}</div>
          <div style={{ color: labelColor, fontSize: 11, marginTop: 3 }}>Total Orders</div>
        </div>
        <div style={{ width: 1, background: divider }} />
        <div>
          <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{recentOrders}</div>
          <div style={{ color: labelColor, fontSize: 11, marginTop: 3 }}>Last 60s</div>
        </div>
        <div style={{ width: 1, background: divider }} />
        <div>
          <div style={{ color: valueColor, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{MOCK_RESTAURANTS.length}</div>
          <div style={{ color: labelColor, fontSize: 11, marginTop: 3 }}>Restaurants</div>
        </div>
      </div>
    </div>
  );
}

// ─── Overlay Controls (top-right of map) ─────────────────────────────────────

function MapControls({
  isDark,
  onModeChange,
}: {
  isDark: boolean;
  onModeChange: (m: "map" | "list") => void;
}) {
  const bg = isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "1px solid rgba(51,65,85,0.7)" : "1px solid rgba(226,232,240,0.9)";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";

  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", transition: "all 0.2s",
    background: active ? (isDark ? "#f1f5f9" : "#255f9aff") : "transparent",
    color: active ? (isDark ? "#0f172a" : "#f1f5f9") : mutedColor,
  });

  return (
    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 50, display: "flex", alignItems: "center", gap: 8 }}>
      {/* Map / List toggle */}
      <div style={{ background: bg, backdropFilter: "blur(16px)", border, borderRadius: 10, padding: 4, display: "flex", gap: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
        <button style={pillStyle(true)}>🗺 Map</button>
        <button style={pillStyle(false)} onClick={() => onModeChange("list")}>☰ List</button>
      </div>

      {/* Demo badge */}
      {MOCK_DATA && (
        <div style={{
          background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.45)",
          borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700,
          color: "#fbbf24", backdropFilter: "blur(8px)", letterSpacing: "0.04em",
        }}>
          ⚡ DEMO
        </div>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function OrderToast({ toast, onDismiss, isDark }: { toast: ToastEntry; onDismiss: (id: string) => void; isDark: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 400); }, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.id, onDismiss]);

  const bg = isDark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)";
  const border = isDark ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(34,197,94,0.35)";
  const nameColor = isDark ? "#f1f5f9" : "#0f172a";
  const subColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <div style={{
      background: bg, backdropFilter: "blur(16px)", border, borderRadius: 12,
      padding: "12px 16px", width: 260,
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(20px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ background: "#22c55e", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em" }}>NEW ORDER</span>
          <div style={{ color: nameColor, fontWeight: 700, fontSize: 13, marginTop: 4 }}>{toast.restaurantName}</div>
          <div style={{ color: subColor, fontSize: 11, marginTop: 2 }}>{toast.userName} · {toast.items} item{toast.items !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 16, marginLeft: 12 }}>${toast.total.toFixed(2)}</div>
      </div>
      <div style={{ marginTop: 10, height: 2, background: isDark ? "rgba(51,65,85,0.8)" : "rgba(226,232,240,0.8)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "#22c55e", borderRadius: 2, animation: "toast-drain 3.5s linear forwards" }} />
      </div>
    </div>
  );
}

// ─── Map Inner ────────────────────────────────────────────────────────────────

function MapInner({
  arcs, pulses, toasts, onDismissToast,
  totalOrders, recentOrders, restaurantOrderCounts,
  isDark, onModeChange,
}: {
  arcs: ArcEntry[];
  pulses: PulseEntry[];
  toasts: ToastEntry[];
  onDismissToast: (id: string) => void;
  totalOrders: number;
  recentOrders: number;
  restaurantOrderCounts: Record<string, number>;
  isDark: boolean;
  onModeChange: (m: "map" | "list") => void;
}) {
  const map = useMap();
  return (
    <>
      {map && <ArcOverlay arcs={arcs} isDark={isDark} />}
      {MOCK_RESTAURANTS.map((restaurant) => (
        <RestaurantMarker
          key={restaurant.id}
          restaurant={restaurant}
          isPulsing={pulses.some((p) => p.restaurantId === restaurant.id)}
          orderCount={restaurantOrderCounts[restaurant.id] ?? 0}
          isDark={isDark}
        />
      ))}
      <StatsHUD totalOrders={totalOrders} recentOrders={recentOrders} isDark={isDark} />
      <MapControls isDark={isDark} onModeChange={onModeChange} />
      <div style={{ position: "absolute", bottom: 24, right: 16, zIndex: 50, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <OrderToast key={t.id} toast={t} onDismiss={onDismissToast} isDark={isDark} />
        ))}
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DashboardMap({
  onModeChange,
}: {
  onModeChange: (m: "map" | "list") => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [arcs, setArcs] = useState<ArcEntry[]>([]);
  const [pulses, setPulses] = useState<PulseEntry[]>([]);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const recentTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setArcs((prev) => prev.filter((a) => now - a.createdAt < ARC_LIFETIME_MS));
      setPulses((prev) => prev.filter((p) => now - p.createdAt < PULSE_DURATION_MS));
      recentTimestampsRef.current = recentTimestampsRef.current.filter((t) => now - t < 60000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNewOrder = useCallback((order: Order) => {
    const now = Date.now();
    recentTimestampsRef.current.push(now);
    setTotalOrders((n) => n + 1);

    const deliveryAddress = order.deliveryAddress as unknown as {
      latitude: number; longitude: number; street: string; city: string;
    };
    if (!deliveryAddress?.latitude) return;

    setArcs((prev) => [...prev, {
      id: `arc-${order.id}`,
      from: order.restaurantLocation,
      to: { latitude: deliveryAddress.latitude, longitude: deliveryAddress.longitude },
      restaurantName: order.restaurantName,
      total: order.totalAmount,
      createdAt: now,
    }]);

    setPulses((prev) => [...prev, {
      id: `pulse-${order.id}`, restaurantId: order.restaurantId, createdAt: now,
    }]);

    setToasts((prev) => [...prev.slice(-3), {
      id: `toast-${order.id}`,
      restaurantName: order.restaurantName,
      userName: `User #${order.userId}`,
      total: order.totalAmount,
      items: order.items.length,
    }]);
  }, []);

  useMockOrders(handleNewOrder);

  const restaurantOrderCounts: Record<string, number> = {};
  arcs.forEach((arc) => {
    const r = MOCK_RESTAURANTS.find((r) => r.name === arc.restaurantName);
    if (r) restaurantOrderCounts[r.id] = (restaurantOrderCounts[r.id] ?? 0) + 1;
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? "";
  // TODO: remove to support dark mode
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`
        @keyframes ping { 75%,100% { transform:scale(2.2); opacity:0; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes toast-drain { from { width:100%; } to { width:0%; } }
      `}</style>

      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: MAP_CENTER_LOC.latitude, lng: MAP_CENTER_LOC.longitude }}
          defaultZoom={MAP_ZOOM}
          mapId={mapId}
          styles={isDark ? DARK_STYLES : LIGHT_STYLES}
          disableDefaultUI
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        >
          <MapInner
            arcs={arcs}
            pulses={pulses}
            toasts={toasts}
            onDismissToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            totalOrders={totalOrders}
            recentOrders={recentTimestampsRef.current.length}
            restaurantOrderCounts={restaurantOrderCounts}
            isDark={isDark}
            onModeChange={onModeChange}
          />
        </Map>
      </APIProvider>
    </div>
  );
}
