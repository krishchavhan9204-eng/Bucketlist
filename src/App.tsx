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

// ⏱️ POLISHED DUAL-FORMAT DATE COMPILER
function standardizeDate(rawDate: any): string {
  if (!rawDate) return "Unknown";
  const cleanStr = rawDate.toString().trim().split(" ")[0]; // Remove time stamp string

  // Handle DD/MM/YYYY format (Household CSV)
  if (cleanStr.includes("/")) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (d.length === 1) d = "0" + d;
      if (m.length === 1) m = "0" + m;
      return `${y}-${m}-${d}`;
    }
  }
  // Handle YYYY-MM-DD format (Spotify CSV)
  return cleanStr;
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
    async function compileCSVStreams() {
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
              lookupMap[row.trackName.toString().trim()] = {
                energy: row.energy || 0,
                tempo: row.tempo || 0,
                valence: row.valence || 0,
              };
            }
          });
        }

        setTransactions(transRes || []);
        setSpotifyHistory(historyRes || []);
        setSpotifyDictMap(lookupMap);
      } catch (error) {
        console.error("❌ Data stream loading fault:", error);
      } finally {
        setLoading(false);
      }
    }
    compileCSVStreams();
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
      timeline[dateKey].spent += Number(tx.Amount) || 0;
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

      timeline[dateKey].msListened += Number(track.ms_played) || 0;

      const features = spotifyDictMap[track.track_name?.toString().trim()];
      if (features) {
        timeline[dateKey].energySum += Number(features.energy) || 0;
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
      .sort((a, b) => b.date.localeCompare(a.date)); // View youngest historical logs first
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

  if (loading)
    return (
      <div className="loading-fallback">
        Mapping analytical data profiles...
      </div>
    );

  return (
    <div className="dashboard-layout">
      {/* 🧠 THEME 1: CONTROL SIDEBAR PANEL */}
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
              <span className="label">Total Play Time Indexed</span>
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
                    • {t.Category}: ₹{t.Amount}
                  </p>
                ))}
                <h5>🎵 Spotify History Logs</h5>
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

      {/* 🕸️ THEME 2: INTERACTIVE SKY CANVAS GRID PLATFORM */}
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
            transactions={transactions.map((t) => ({
              ...t,
              date: standardizeDate(t.Date),
              amount: t.Amount,
              category: t.Category,
            }))}
            spotifyHistory={spotifyHistory.map((s) => ({
              ...s,
              endTime: standardizeDate(s.ts),
              trackName: s.track_name,
              artistName: s.artist_name,
            }))}
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
