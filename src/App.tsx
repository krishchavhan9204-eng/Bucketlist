import { useEffect, useState, useMemo } from "react";
import { fetchCSV } from "./utils/dataLoder";
import type {
  HouseholdTransaction,
  SpotifyHistoryItem,
  SpotifyDictionaryRow,
  DailyLifeSnapshot,
} from "./types/insights";
import MemoryGraph from "./components/MemoryGraph";
import "./App.css";

// ⏱️ STABLE DUAL-FORMAT DATE PARSER
function standardizeDate(rawDate: any): string {
  if (!rawDate) return "Unknown";
  const cleanStr = rawDate.toString().trim().split(" ")[0];

  if (cleanStr.includes("/")) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (d.length === 1) d = "0" + d;
      if (m.length === 1) m = "0" + m;
      return `${y}-${m}-${d}`;
    }
  }
  return cleanStr;
}

// 🧮 FAIL-SAFE STRING-TO-NUMBER CONVERTER
function cleanNumericValue(val: any): number {
  if (val === undefined || val === null) return 0;
  const cleanStr = val.toString().replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

// 🔤 DEEP TEXT SANITIZER FOR SPOTIFY KEY LOOKUPS
function sanitizeTrackKey(name: any): string {
  if (!name) return "";
  return name
    .toString()
    .toLowerCase()
    .replace(/["']/g, "") // Remove double and single quotation marks completely
    .replace(/[^\w\s]/gi, "") // Strip out brackets, hyphens, and punctuation symbols
    .trim();
}

export default function App() {
  const [transactions, setTransactions] = useState<HouseholdTransaction[]>([]);
  const [spotifyHistory, setSpotifyHistory] = useState<SpotifyHistoryItem[]>(
    [],
  );
  const [spotifyDictMap, setSpotifyDictMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllCSVLogs() {
      try {
        const [transRes, historyRes, dictRes] = await Promise.all([
          fetchCSV<HouseholdTransaction>("/data/household_transactions.csv"),
          fetchCSV<SpotifyHistoryItem>("/data/spotify_history.csv"),
          fetchCSV<SpotifyDictionaryRow>("/data/spotify_dictionary.csv"),
        ]);

        const lookupMap: Record<string, any> = {};
        if (dictRes && Array.isArray(dictRes)) {
          dictRes.forEach((row) => {
            if (row.trackName) {
              const cleanKey = sanitizeTrackKey(row.trackName);
              lookupMap[cleanKey] = {
                energy: cleanNumericValue(row.energy),
                tempo: cleanNumericValue(row.tempo),
                valence: cleanNumericValue(row.valence),
              };
            }
          });
        }

        setTransactions(transRes || []);
        setSpotifyHistory(historyRes || []);
        setSpotifyDictMap(lookupMap);
      } catch (error) {
        console.error("❌ Data pipeline indexing crashed:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAllCSVLogs();
  }, []);

  const dailyChronicles = useMemo((): DailyLifeSnapshot[] => {
    const timeline: Record<
      string,
      {
        spent: number;
        txCount: number;
        msListened: number;
        energySum: number;
        tracksWithFeatures: number;
      }
    > = {};

    transactions.forEach((tx) => {
      if (!tx.Date) return;
      const dateKey = standardizeDate(tx.Date);
      if (!timeline[dateKey]) {
        timeline[dateKey] = {
          spent: 0,
          txCount: 0,
          msListened: 0,
          energySum: 0,
          tracksWithFeatures: 0,
        };
      }
      timeline[dateKey].spent += cleanNumericValue(tx.Amount);
      timeline[dateKey].txCount += 1;
    });

    spotifyHistory.forEach((track) => {
      if (!track.ts) return;
      const dateKey = standardizeDate(track.ts);
      if (!timeline[dateKey]) {
        timeline[dateKey] = {
          spent: 0,
          txCount: 0,
          msListened: 0,
          energySum: 0,
          tracksWithFeatures: 0,
        };
      }

      timeline[dateKey].msListened += cleanNumericValue(track.ms_played);

      const trackNameKey = sanitizeTrackKey(track.track_name);
      const features = spotifyDictMap[trackNameKey];
      if (features) {
        timeline[dateKey].energySum += cleanNumericValue(features.energy);
        timeline[dateKey].tracksWithFeatures += 1;
      }
    });

    return Object.keys(timeline)
      .map((date): DailyLifeSnapshot => {
        const day = timeline[date];
        return {
          date,
          totalSpent: Math.round(day.spent),
          transactionCount: day.txCount,
          totalMusicMinutes: Math.round(day.msListened / 60000),
          averageEnergy:
            day.tracksWithFeatures > 0
              ? parseFloat((day.energySum / day.tracksWithFeatures).toFixed(2))
              : 0,
          averageValence: 0,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, spotifyHistory, spotifyDictMap]);

  const summaryMetrics = useMemo(() => {
    if (dailyChronicles.length === 0) return null;
    const totalSpending = dailyChronicles.reduce(
      (sum, day) => sum + day.totalSpent,
      0,
    );
    const totalMinutes = dailyChronicles.reduce(
      (sum, day) => sum + day.totalMusicMinutes,
      0,
    );
    return { totalSpending, totalMinutes };
  }, [dailyChronicles]);

  const filteredData = useMemo(() => {
    if (!activeDateFilter) return { transactions: [], spotifyHistory: [] };
    return {
      transactions: transactions.filter(
        (t) => standardizeDate(t.Date) === activeDateFilter,
      ),
      spotifyHistory: spotifyHistory.filter(
        (s) => standardizeDate(s.ts) === activeDateFilter,
      ),
    };
  }, [activeDateFilter, transactions, spotifyHistory]);

  const mappedTransactions = useMemo(() => {
    return transactions.map((t) => ({
      Date: standardizeDate(t.Date),
      Amount: cleanNumericValue(t.Amount),
      Category: t.Category,
    }));
  }, [transactions]);

  const mappedSpotifyHistory = useMemo(() => {
    return spotifyHistory.map((s) => ({
      endTime: standardizeDate(s.ts),
      trackName: s.track_name,
      artistName: s.artist_name,
    }));
  }, [spotifyHistory]);

  if (loading)
    return (
      <div className="loading-fallback">
        Mapping analytical data profiles...
      </div>
    );

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="title-memory-matrix">🧠 Memory Matrix</h2>
          <div className="upload-indicator">Status: Active</div>
        </div>

        {summaryMetrics && (
          <div className="insights-panel">
            <h3>📈 Cumulative Ledger Metrics</h3>
            <div className="insight-card">
              <span className="label">Total Managed Budget</span>
              <span className="value high-contrast">
                ₹{summaryMetrics.totalSpending.toLocaleString()}
              </span>
            </div>
            <div className="insight-card">
              <span className="label">Total Play Time Mapped</span>
              <span className="value">{summaryMetrics.totalMinutes} mins</span>
            </div>
          </div>
        )}

        <div className="story-inspector">
          <h3>📖 Selected Day Context</h3>
          {activeDateFilter ? (
            <div className="inspector-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h4>📅 {activeDateFilter}</h4>
                <button
                  className="clear-btn"
                  onClick={() => setActiveDateFilter(null)}
                >
                  Reset
                </button>
              </div>
              <div style={{ marginTop: "12px" }}>
                <h5>🛒 Transactions</h5>
                {filteredData.transactions.map((t, i) => (
                  <p key={i} className="inspector-item status-expense">
                    • {t.Category}: ₹{cleanNumericValue(t.Amount)}
                  </p>
                ))}
                <h5>🎵 Spotify Tracks</h5>
                {filteredData.spotifyHistory.slice(0, 4).map((s, i) => (
                  <p key={i} className="inspector-item status-audio">
                    • {s.track_name} ({s.artist_name})
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-inspector-text">
              Select any timeline node or row link to isolate records.
            </p>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="main-content-header">
          <h1 className="title-behavioral-map">
            🕸️ Behavioral Sound & Structure Map
          </h1>
          <p className="subtitle">
            Visualizing chronological activity branches across independent life
            logs.
          </p>
        </header>

        <section className="canvas-wrapper">
          <MemoryGraph
            transactions={mappedTransactions}
            spotifyHistory={mappedSpotifyHistory}
            spotifyDict={spotifyDictMap}
          />
        </section>

        <section className="timeline-table-section">
          <h3>🗓️ Unified Chronological Ledger</h3>
          <div className="timeline-list">
            {dailyChronicles.map((day) => (
              <div
                key={day.date}
                className={`timeline-row ${activeDateFilter === day.date ? "selected-row" : ""}`}
                onClick={() => setActiveDateFilter(day.date)}
              >
                <div className="row-date-group">
                  <span className="bullet-indicator"></span>
                  <strong className="row-date">{day.date}</strong>
                </div>
                <span className="row-metric expense-text">
                  🛒 ₹{day.totalSpent} ({day.transactionCount} tx)
                </span>
                <span className="row-metric audio-text">
                  🎧 {day.totalMusicMinutes} mins stream
                </span>
                <span className="row-metric energy-text">
                  ⚡ {day.averageEnergy} Energy
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
