# React + TypeScript + Vite

# 🧠 Life Memories: Behavioral Sound & Structure Map

An interactive, responsive single-page web dashboard that combines everyday physical lifestyle metrics with digital media footprint logs. By linking local household financial transitions with Spotify streaming histories, this application automatically paints a visual story of what your life looked like—and sounded like—on any given calendar day.

---

## ✨ Core Functionality

### 1. Unified Multi-Source CSV Loader

- **Asynchronous Execution:** Downloads multiple raw spreadsheets (`household_transactions.csv`, `spotify_history.csv`, and `spotify_dictionary.csv`) simultaneously from the `public/data/` index structure using a customized `PapaParse` runtime layer.
- **Fail-Safe Data Compilation:** Standardizes mismatched date formatting styles (e.g., converting `DD/MM/YYYY HH:MM:SS` and `YYYY-MM-DD` styles uniformly into clean `YYYY-MM-DD` timeline anchors).
- **String Sanitization Look-Ups:** Uses deep text string cleaning (removes punctuation, brackets, quotes, and whitespace variances) to guarantee track properties correlate flawlessly with historical plays.

### 2. 🕸️ Interactive Relational Cloud Canvas

- **Node-Based Mapping Matrix:** Powered by `React Flow`, individual milestones float as stylized, cloud-shaped nodes across an animated blue sky canvas grid.
- **Visual Color Hierarchy:**
  - **White Clouds:** Represent individual calendar dates acting as central timeline anchors.
  - **Soft Pink Clouds:** Illustrate financial household transactions branching off from specific dates.
  - **Mint Green Clouds:** Detail music streaming selections tied directly to the day's background soundtrack.
- **Micro-Animations:** edges pulse dynamically to mimic continuous wind vectors shifting data points along your historical timeline.

### 3. 📈 Automated Pattern Analytics Engine

- **Cross-Over Calculations:** Computes comprehensive metrics per day, linking transaction frequency counts with musical features like average acoustic energy scores.
- **Deep Control Sidebar:** Features a high-contrast Sapphire Blue panel hosting macroscopic sums, active sync validation points, and interactive day context drawers.

### 4. 📱 Mobile Responsive Interface

- **Flex-Stack Adaptations:** Transitions cleanly from an asymmetric split-screen desktop grid to a mobile-first column configuration.
- **Touch-Optimized Interaction:** Centers and restricts graph boundaries, providing smooth canvas navigation on smartphone device screens.

---

## 💡 Real-World Use Cases

### 🎵 Use Case A: Finding the Soundtrack to Your Productivity

- **Scenario:** You want to discover what specific background genres or playlist rhythms help you stay focused during routine home management intervals.
- **The App Answer:** By filtering your ledger down to days marked by heavy chores or high shopping frequencies (Pink nodes), the timeline reveals if your track energy averages (Green nodes) spiked to keep you motivated.

### 📉 Use Case B: Identifying Emotional Spending Triggers

- **Scenario:** You want to analyze if your mood or aesthetic taste in music has a direct correlation with impulsive spending choices.
- **The App Answer:** The "Selected Day Context" window lets you cross-reference transaction magnitudes directly with audio dictionary metadata. You can visually trace whether low-valence or high-tempo listening blocks match your high-expense logs.

### 📜 Use Case C: A Digital Interactive Scrapbook

- **Scenario:** Looking back at a specific month years later to recall what your daily routine felt like.
- **The App Answer:** The app smoothly accommodates disparate logs (like 2013 music profiles alongside 2018 financial indexes), charting a chronological ledger that recreates long-lost timelines.

---

## 🛠️ Technology Stack

- **Framework Stage:** React 19 (Functional Components with strict `useMemo` caching)
- **Build Ecosystem:** Vite + TypeScript (Strong type safety contracts for all data shapes)
- **Visual Interaction Matrix:** React Flow (`@xyflow/react`)
- **File Parsing Engine:** PapaParse (`papaparse`)
- **Styling Architecture:** Pure CSS3 (Custom keyframe animations, flex layout matrices, and Glassmorphism variables)

---

## 🚀 Setup & Installation Instructions

### 1. Clone & Install Dependencies

```bash
# Navigate to your project directory
cd my-memories-app

# Install package modules
npm install
```

### 2. Configure Your Source Data Files

Ensure your data assets match these naming paths exactly inside your local workspace layout:

```text
my-memories-app/
└── public/
    └── data/
        ├── household_transactions.csv   # Must contain: Date, Amount, Category
        ├── spotify_history.csv          # Must contain: ts, track_name, artist_name, ms_played
        └── spotify_dictionary.csv       # Must contain: trackName, energy, tempo, valence
```

### 3. Boot Up the Engine

```bash
# Run local Vite development hot-reloader server
npm run dev
```

Open **`http://localhost:5173`** in your browser window to run the dashboard platform!
