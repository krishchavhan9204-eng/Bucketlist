import { useMemo } from "react";
import { ReactFlow, Controls } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface HouseholdTransaction {
  Date: string;
  Amount: number;
  Category: string;
}

interface SpotifyHistoryItem {
  endTime: string;
  trackName: string;
  artistName: string;
}

interface MemoryGraphProps {
  transactions: HouseholdTransaction[];
  spotifyHistory: SpotifyHistoryItem[];
  spotifyDict: Record<string, any>;
}

export default function MemoryGraph({
  transactions,
  spotifyHistory,
  spotifyDict,
}: MemoryGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const dailyGroups: Record<
      string,
      { txs: HouseholdTransaction[]; tracks: SpotifyHistoryItem[] }
    > = {};

    transactions.forEach((tx) => {
      if (!tx.Date) return;
      const cleanDate = tx.Date.toString().trim();
      if (!dailyGroups[cleanDate])
        dailyGroups[cleanDate] = { txs: [], tracks: [] };
      dailyGroups[cleanDate].txs.push(tx);
    });

    spotifyHistory.forEach((track) => {
      if (!track.endTime) return;
      const cleanDate = track.endTime.toString().trim();
      if (!dailyGroups[cleanDate])
        dailyGroups[cleanDate] = { txs: [], tracks: [] };
      dailyGroups[cleanDate].tracks.push(track);
    });

    const uniqueDays = Object.keys(dailyGroups).sort();

    uniqueDays.forEach((date, dayIndex) => {
      const dayData = dailyGroups[date];
      const centerX = dayIndex * 520;
      const centerY = 240;

      // 📅 CENTRAL TIMELINE NODE (Fluffy White Base Clouds)
      newNodes.push({
        id: `date-${date}`,
        data: { label: `☁️\n${date}` },
        position: { x: centerX, y: centerY },
        style: {
          background: "#FFFFFF",
          color: "#0284C7",
          border: "3px solid #7DD3FC",
          borderRadius: "40px",
          width: 110,
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "12px",
          textAlign: "center",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
        },
      });

      // 🛒 TRANSACTION NODES (Soft Pink Rain Clouds)
      dayData.txs.forEach((tx, txIndex) => {
        const txNodeId = `tx-${date}-${txIndex}`;
        newNodes.push({
          id: txNodeId,
          data: { label: `🛍️ ${tx.Category}\n₹${tx.Amount}` },
          position: { x: centerX - 60 + txIndex * 150, y: centerY - 140 },
          style: {
            background: "#FEF2F2",
            color: "#991B1B",
            border: "2px solid #FCA5A5",
            borderRadius: "24px",
            padding: "12px",
            fontSize: "12px",
            textAlign: "center",
            whiteSpace: "pre-wrap",
            width: 130,
            boxShadow: "0 4px 6px rgba(239, 68, 68, 0.05)",
          },
        });

        newEdges.push({
          id: `edge-${txNodeId}`,
          source: txNodeId,
          target: `date-${date}`,
          style: { stroke: "#FCA5A5", strokeWidth: 2, strokeDasharray: "4 4" },
        });
      });

      // 🎧 SPOTIFY NODES (Mint Green Breeze Clouds)
      dayData.tracks.slice(0, 2).forEach((track, trackIndex) => {
        const trackNodeId = `track-${date}-${trackIndex}`;
        const features = spotifyDict[track.trackName?.toString().trim()];
        const energyLabel = features
          ? `⚡ Energy: ${features.energy}`
          : "🎵 Track Loaded";

        newNodes.push({
          id: trackNodeId,
          data: { label: `🎵 ${track.trackName}\n${energyLabel}` },
          position: { x: centerX - 60 + trackIndex * 160, y: centerY + 140 },
          style: {
            background: "#F0FDF4",
            color: "#166534",
            border: "2px solid #86EFAC",
            borderRadius: "24px",
            padding: "12px",
            fontSize: "11px",
            textAlign: "center",
            whiteSpace: "pre-wrap",
            width: 140,
            boxShadow: "0 4px 6px rgba(34, 197, 94, 0.05)",
          },
        });

        newEdges.push({
          id: `edge-${trackNodeId}`,
          source: `date-${date}`,
          target: trackNodeId,
          animated: true,
          style: { stroke: "#86EFAC", strokeWidth: 2 },
        });
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [transactions, spotifyHistory, spotifyDict]);

  return (
    <div style={{ width: "100%", height: "520px", position: "relative" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Controls
          style={{
            background: "#FFFFFF",
            border: "1px solid #BAE6FD",
            borderRadius: "8px",
          }}
        />
      </ReactFlow>
    </div>
  );
}
