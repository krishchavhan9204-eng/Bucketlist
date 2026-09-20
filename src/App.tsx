import { useEffect, useState, useMemo } from "react";
import { fetchCSV } from "./utils/dataLoder";
import type {
  HouseholdTransaction,
  SpotifyHistoryItem,
  SpotifyDictionary,
  DailyLifeSnapshot,
} from "./types/insights";
import MemoryGraph from "./components/MemoryGraph";
import "./App.css";

export default function App() {
  const [transactions, setTransactions] = useState<HouseholdTransaction[]>([]);
  const [spotifyHistory, setSpotifyHistory] = useState<SpotifyHistoryItem[]>(
    [],
  );
  const [spotifyDict, setSpotifyDict] = useState<SpotifyDictionary>({});
  const [loading, setLoading] = useState(true);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllLifeLogs() {
      try {
        const [transRes, historyRes, dictRes] = await Promise.all([
          fetchCSV<HouseholdTransaction>("/data/household_transactions.csv"),
          fetch("/data/spotify_history.json").then(
            (res) => res.json() as Promise<SpotifyHistoryItem[]>,
          ),
          fetch("/data/spotify_dictionary.json").then(
            (res) => res.json() as Promise<SpotifyDictionary>,
          ),
        ]);

        setTransactions(transRes);
        setSpotifyHistory(historyRes);
        setSpotifyDict(dictRes);
      } catch (error) {
        console.error("Error synchronizing life data streams:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAllLifeLogs();
  }, []);

  const dailyChronicles = useMemo((): DailyLifeSnapshot[] => {
    if (!transactions.length && !spotifyHistory.length) return [];

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
      if (!tx.date) return;
      if (!timeline[tx.date]) {
        timeline[tx.date] = {
          spent: 0,
          txCount: 0,
          msListened: 0,
          energySum: 0,
          tracksWithFeatures: 0,
        };
      }
      timeline[tx.date].spent += tx.amount || 0;
      timeline[tx.date].txCount += 1;
    });

    spotifyHistory.forEach((track) => {
      if (!track.endTime) return;
      const dateKey = track.endTime.split(" ")[0]; // Extract YYYY-MM-DD

      if (!timeline[dateKey]) {
        timeline[dateKey] = {
          spent: 0,
          txCount: 0,
          msListened: 0,
          energySum: 0,
          tracksWithFeatures: 0,
        };
      }

      timeline[dateKey].msListened += track.msPlayed || 0;

      const features =
        spotifyDict[track.trackName] || spotifyDict[track.artistName];
      if (features) {
        timeline[dateKey].energySum += features.energy || 0;
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
  }, [transactions, spotifyHistory, spotifyDict]);

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
    const sortedByEnergy = [...dailyChronicles].sort(
      (a, b) => b.averageEnergy - a.averageEnergy,
    );

    return {
      totalSpending,
      totalMinutes,
      peakEnergyDate: sortedByEnergy[0]?.date || "N/A",
      peakEnergyValue: sortedByEnergy[0]?.averageEnergy || 0,
    };
  }, [dailyChronicles]);

  const filteredData = useMemo(() => {
    if (!activeDateFilter) return { transactions, spotifyHistory };
    return {
      transactions: transactions.filter((t) => t.date === activeDateFilter),
      spotifyHistory: spotifyHistory.filter((s) =>
        s.endTime.startsWith(activeDateFilter),
      ),
    };
  }, [activeDateFilter, transactions, spotifyHistory]);

  if (loading)
    return (
      <div className="loading-fallback">
        Decoding habits and audio profiles...
      </div>
    );

  return (
    <div className="dashboard-layout">
      {/* 🧠 THEME 1: DEEP SAPPHIRE BLUE CONTROL PANEL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="title-memory-matrix">🧠 Memory Matrix</h2>
          <div className="upload-indicator">⚡ Core Synced</div>
        </div>

        {summaryMetrics && (
          <div className="insights-panel">
            <h3>📈 Deep Logs Summaries</h3>
            <div className="insight-card">
              <span className="label">Total Budget Tracked</span>
              <span className="value high-contrast">
                ₹{summaryMetrics.totalSpending.toLocaleString()}
              </span>
            </div>
            <div className="insight-card">
              <span className="label">Soundtrack Duration</span>
              <span className="value">{summaryMetrics.totalMinutes} mins</span>
            </div>
            <div className="insight-card">
              <span className="label">Peak Sonic Focus Day</span>
              <span className="value">
                {summaryMetrics.peakEnergyDate} (
                {summaryMetrics.peakEnergyValue} energy)
              </span>
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
                <h5>🛒 Household Transactions</h5>
                {filteredData.transactions.map((t, i) => (
                  <p key={i} className="inspector-item status-expense">
                    • <strong>{t.category}</strong>: ₹{t.amount}
                  </p>
                ))}
                <h5 style={{ marginTop: "12px" }}>🎵 Active Audio Tracks</h5>
                {filteredData.spotifyHistory.slice(0, 3).map((s, i) => (
                  <p key={i} className="inspector-item status-audio">
                    • {s.trackName} - {s.artistName}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-inspector-text">
              Click a cloud node or timeline link to isolate contextual data
              frames.
            </p>
          )}
        </div>
      </aside>

      {/* 🕸️ THEME 2: FLOATING CLOUD OPEN SKY SPACE */}
      <main className="main-content">
        <header className="main-content-header">
          <h1 className="title-behavioral-map">
            🕸️ Behavioral Sound & Structure Map
          </h1>
          <p className="subtitle">
            An open playground charting daily household transactional flows
            against your streaming histories.
          </p>
        </header>

        <section className="canvas-wrapper">
          <MemoryGraph
            transactions={transactions}
            spotifyHistory={spotifyHistory}
            spotifyDict={spotifyDict}
          />
        </section>

        <section className="timeline-table-section">
          <h3>🗓️ Chronological Ledger</h3>
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
                  🎧 {day.totalMusicMinutes} mins
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
