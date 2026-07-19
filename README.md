# Algorithm Vizualiser

A full-stack web app that visualizes optimization algorithms live: **Traveling Salesman Problem** (India map), **Knapsack**, and the **Assignment Problem**. 
Built with FastAPI (backend) + React/Vite  (frontend), streaming algorithm progress over WebSockets in real wall-clock time, with up to 4 algorithms running side-by-side for comparison.

**Stack:** FastAPI + WebSockets (backend) | React + Vite + Leaflet + Recharts (frontend)
**Deployed:** Backend on Render, Frontend on Vercel

---

## 1. Traveling Salesman Problem (TSP)

Pick cities on a map of India (national state capitals, or per-state district HQs), pick a start city, and watch up to 4 algorithms race to find the shortest round-trip route.

**Metric:** distance= haversine (great-circle) distance between lat/lon points, in km. **Not real road distance**.

**Algorithms:**

| Algorithm | Category | What it does |
|---|---|---|
| Nearest Neighbor | Construction | From the current city, always jump to the closest unvisited city. Fast, often ~20-25% worse than optimal. |
| Random Paths | Baseline | Generates random tours, keeps the best seen; included to show how much smarter the other algorithms are. |
| Brute Force (DFS) | Exhaustive | Tries every possible tour. **Capped at 10 cities** ((n-1)!/2 grows too fast beyond that). |
| Branch & Bound (Cost) | Exhaustive | DFS with a lower-bound prune (current cost + cheapest edge out). Guarantees optimal. **Capped at 15 cities.** |

**"Possible tours" shown in the UI**= (n-1)!/2 for n selected cities
(symmetric TSP, fixed start point).

---

## 2. Knapsack Problem

Pick an item set (weight + value per item) and a bag capacity, and watch algorithms decide what to pack for maximum value without exceeding capacity.

**Metric:** total value (points) of packed items, subject to total weight ≤ capacity.

**Algorithms:**

| Algorithm | Category | What it does |
|---|---|---|
| Fractional Knapsack | Greedy baseline | Sorts items by value/weight ratio, takes as much of each as fits; including *fractions* of items. **Not valid for true 0/1** (you can't take 30% of a laptop). |
| 0/1 Knapsack (DP) | Exact | Classic bottom-up dynamic programming table. `dp[i][w]`= best value using first `i` items with capacity `w`. Live view shows the table filling row by row. |
| Brute Force | Exhaustive | Tries all 2ⁿ subsets. **Capped at 20 items.** |
| Branch & Bound | Exhaustive | DFS with a fractional-relaxation upper bound for pruning. Guarantees optimal. **Capped at 30 items.** |

**"Possible subsets" shown in the UI**= 2ⁿ for n selected items.

---

## 3. Assignment Problem

Assign N workers to N jobs to minimize total cost (time/effort), using a preset cost matrix (e.g. delivery riders-routes, or team members-projects).

**Metric:** total cost (sum of the cost of each worker's assigned job).

**Algorithms:**

| Algorithm | Category | What it does |
|---|---|---|
| Greedy Assignment | Construction heuristic | Repeatedly picks the globally cheapest available worker-job pair. Fast, not always optimal. |
| Hungarian Algorithm | Exact (Kuhn-Munkres) | Row reduction - column reduction - iteratively covers zeros with minimum lines, adjusting the matrix until an optimal zero-matching exists. The classic O(n³) algorithm; this is what real-world assignment/scheduling systems use. |
| Brute Force | Exhaustive | Tries all n! permutations of worker-job assignments. **Capped at 8 workers.** |
| Branch & Bound | Exhaustive | DFS with a row-minimum lower bound for pruning. Guarantees optimal. **Capped at 10 workers.** |

**"Possible assignments" shown in the UI**= n! for n workers/jobs.

**Note:** It's a direct algebraic method, not an iterative search. So its live Graph view will look sparse. Use the Matrix view to watch its actual progress.

---

## Shared design across all three visualizers

- **WebSocket streaming**: each algorithm run streams live step-by-step updates in true wall-clock time (no artificial syncing); fast algorithms finish almost instantly, slower ones animate visibly.
- **Up to 4 panels**, split-screen, same input data locked across panels, only the algorithm differs per panel for fair comparison.
- **Live stats per panel**: current best value, elapsed time, status.
- **Graph view**: value/distance/cost vs. time or step count, toggleable.
- **View Code button**: shows the exact Python source of the algorithm currently running in that panel (via `inspect.getsource`), for demo purposes.

---

## Disclaimers & known simplifications

- **TSP distances are straight-line (haversine), not real road distances.**
  Actual driving distance/time would require a routing engine like OSRM noted here as an honest limitation, not hidden. A natural "v2" improvement.
- **Algorithm city/item/worker caps** (Brute Force, Branch & Bound variants)
  are intentional; factorial/exponential growth makes them impractical beyond those sizes on a live demo. The UI warns before you hit Run if your selection exceeds an algorithm's cap.
- **Branch & Bound's bound function is a simple heuristic** (nearest-edge /row-minimum),
  not the tightest possible bound (e.g. a minimum-spanning-tree bound for TSP). It prunes correctly and guarantees optimal results.

---

## Local development

```bash
# backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install fastapi==0.115.0 "uvicorn[standard]==0.30.6" websockets==13.1
uvicorn app.main:app --reload --port 8000

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```
