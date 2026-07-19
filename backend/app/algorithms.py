import math
import random
import itertools

def haversine(a, b):
    """Great-circle distance in km between two {"lat","lon"} points."""
    R= 6371.0
    lat1, lon1= math.radians(a["lat"]), math.radians(a["lon"])
    lat2, lon2= math.radians(b["lat"]), math.radians(b["lon"])
    dlat, dlon= lat2-lat1, lon2-lon1
    h= math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2*R*math.asin(math.sqrt(h))

def build_distance_matrix(cities):
    n= len(cities)
    mat= [[0.0]*n for _ in range(n)]
    for i in range(n):
        for j in range(i+1, n):
            d= haversine(cities[i], cities[j])
            mat[i][j]=mat[j][i]=d
    return mat

def tour_length(tour_idx, dist):
    total= 0.0
    for i in range(len(tour_idx)):
        total+= dist[tour_idx[i]][tour_idx[(i+1)%len(tour_idx)]]
    return total

def num_possible_tours(n):
    """(n-1)!/2 for symmetric TSP with fixed start."""
    if n<3:
        return 1
    return math.factorial(n - 1)//2

def convex_hull(cities):
    """Monotone chain, returns list of indices in order."""
    pts= sorted(range(len(cities)), key=lambda i: (cities[i]["lon"], cities[i]["lat"]))
    if len(pts)<=2:
        return pts
    def cross(o, a, b):
        return ((cities[a]["lon"]-cities[o]["lon"])*(cities[b]["lat"]-cities[o]["lat"])-(cities[a]["lat"]-cities[o]["lat"])*(cities[b]["lon"]-cities[o]["lon"]))
    lower= []
    for p in pts:
        while len(lower)>=2 and cross(lower[-2], lower[-1], p)<=0:
            lower.pop()
        lower.append(p)
    upper= []
    for p in reversed(pts):
        while len(upper)>=2 and cross(upper[-2], upper[-1], p)<=0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

def segments_intersect(a, b, c, d):
    """True if segment a-b crosses segment c-d (proper geometric intersection,
    used as an extra pruning heuristic for Branch & Bound with intersection
    checking; two crossing edges can never appear in an optimal tour)."""
    def orient(p, q, r):
        val= (q["lon"]-p["lon"])*(r["lat"]-p["lat"])-(q["lat"]-p["lat"])*(r["lon"]-p["lon"])
        if abs(val)<1e-12:
            return 0
        return 1 if val>0 else -1
    o1, o2= orient(a, b, c), orient(a, b, d)
    o3, o4= orient(c, d, a), orient(c, d, b)
    return o1 != o2 and o3 != o4

def nearest_neighbor(cities, dist, start_idx=0, trace=False):
    n= len(cities)
    visited= [False]*n
    tour= [start_idx]
    visited[start_idx]= True
    step_no= 0
    yield {"type": "step", "tour": tour[:], "distance": 0.0, "step_no": step_no}
    while len(tour)<n:
        cur= tour[-1]
        nearest, nearest_d= None, float("inf")
        candidates= []
        for j in range(n):
            if not visited[j]:
                candidates.append({"city": cities[j]["id"], "distance": round(dist[cur][j], 1)})
                if dist[cur][j]<nearest_d:
                    nearest, nearest_d= j, dist[cur][j]
        if trace:
            yield {"type": "candidates", "tour": tour[:], "candidates": candidates, "chosen": cities[nearest]["id"], "step_no": step_no}
        tour.append(nearest)
        visited[nearest]= True
        step_no+= 1
        yield {
            "type": "step",
            "tour": tour[:],
            "distance": tour_length(tour, dist),
            "step_no": step_no,
        }
    yield {"type": "done", "tour": tour[:], "distance": tour_length(tour, dist), "step_no": step_no+1}

def random_paths(cities, dist, start_idx=0, num_samples=2000, seed=3, trace=False, trace_samples=150):
    """Generate random permutations, keep the best seen. A baseline to show
    how much smarter the other algorithms are; include for comparison."""
    n= len(cities)
    rng= random.Random(seed)
    others= [i for i in range(n) if i != start_idx]
    best_tour, best_len= None, float("inf")
    step_no= 0
    for _ in range(num_samples):
        candidate_others= others[:]
        rng.shuffle(candidate_others)
        candidate= [start_idx]+candidate_others
        length= tour_length(candidate, dist)
        step_no+= 1
        is_best= length<best_len
        if trace and _<trace_samples:
            yield {"type": "leaf", "tour": candidate[:], "distance": round(length, 1), "step_no": step_no, "is_best": is_best}
            if _ == trace_samples-1:
                yield {"type": "leaf", "tour": candidate[:], "distance": round(length, 1), "step_no": step_no,
                       "is_best": False,
                       "note": f"trace preview limited to first {trace_samples} samples-algorithm continues silently to real completion"}
        if is_best:
            best_tour, best_len = candidate, length
            yield {"type": "step", "tour": best_tour[:], "distance": best_len, "step_no": step_no}
    yield {"type": "done", "tour": best_tour[:], "distance": best_len, "step_no": step_no+1}

def brute_force(cities, dist, start_idx=0, max_cities=10, trace=False, trace_max_cities=7):
    """Only safe for small n (<= ~10); true exhaustive search."""
    n= len(cities)
    cap= trace_max_cities if trace else max_cities
    if n>cap:
        label= "Trace mode" if trace else "Brute force"
        yield {"type": "done", "tour": [], "distance": -1, "step_no": 0, "error": f"{label} capped at {cap} cities (got {n})."}
        return
    others= [i for i in range(n) if i != start_idx]
    best_tour, best_len= None, float("inf")
    step_no= 0
    for perm in itertools.permutations(others):
        candidate= [start_idx]+list(perm)
        length= tour_length(candidate, dist)
        step_no+= 1
        is_best= length<best_len
        if trace:
            yield {"type": "leaf", "tour": candidate[:], "distance": round(length, 1),"step_no": step_no, "is_best": is_best}
        if is_best:
            best_tour, best_len= candidate, length
            yield {"type": "step", "tour": best_tour[:], "distance": best_len, "step_no": step_no}
    yield {"type": "done", "tour": best_tour[:], "distance": best_len, "step_no": step_no+1}

def branch_and_bound(cities, dist, start_idx=0, max_cities=15, trace=False):
    """Classic B&B with a simple lower bound; maintains current best throughout."""
    n= len(cities)
    if n>max_cities:
        yield {"type": "done", "tour": [], "distance": -1, "step_no": 0, "error": f"Branch & Bound capped at {max_cities} cities (got {n})."}
        return
    best_tour, best_len= None, float("inf")
    step_no= 0
    def bound(path, visited_mask):
        if len(path)== n:
            return tour_length(path, dist)
        total= tour_length(path, dist)-dist[path[-1]][path[0]] if len(path)>1 else 0
        last= path[-1]
        remaining= [i for i in range(n) if not (visited_mask>>i)&1]
        if remaining:
            total+= min(dist[last][r] for r in remaining)
        return total
    stack= [([start_idx],1<<start_idx)]
    while stack:
        path, mask= stack.pop()
        step_no+= 1
        if trace:
            yield {"type": "explore", "tour": path[:], "step_no": step_no}
        if len(path)== n:
            length= tour_length(path, dist)
            is_best= length<best_len
            if trace:
                yield {"type": "leaf", "tour": path[:], "distance": round(length, 1),"step_no": step_no, "is_best": is_best}
            if is_best:
                best_tour, best_len= path[:], length
                yield {"type": "step", "tour": best_tour[:], "distance": best_len, "step_no": step_no}
            continue
        b= bound(path, mask)
        if b>=best_len:
            if trace:
                yield {"type": "prune", "tour": path[:], "step_no": step_no, "bound": round(b, 1)}
            continue
        for nxt in range(n):
            if (mask>>nxt) & 1:
                continue
            new_path= path+[nxt]
            new_mask= mask|(1<<nxt)
            if bound(new_path, new_mask)<best_len:
                stack.append((new_path, new_mask))
    yield {"type": "done", "tour": best_tour[:] if best_tour else [], "distance": best_len, "step_no": step_no+1}

ALGORITHMS = {
    "nearest_neighbor": nearest_neighbor,
    "random_paths": random_paths,
    "brute_force": brute_force,
    "branch_and_bound": branch_and_bound,
}