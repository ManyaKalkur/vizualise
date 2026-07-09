import copy
import itertools

def total_cost(cost_matrix, assignment):
    return sum(cost_matrix[i][assignment[i]] for i in range(len(assignment)))

def greedy_assignment(cost_matrix, workers=None, jobs=None):
    n= len(cost_matrix)
    used_workers, used_jobs= set(), set()
    assignment= [None]*n
    step_no= 0
    triples= sorted(
        ((cost_matrix[i][j], i, j) for i in range(n) for j in range(n)),
        key=lambda t: t[0],
    )
    running_cost= 0
    for cost, i, j in triples:
        if i in used_workers or j in used_jobs:
            continue
        assignment[i]= j
        used_workers.add(i)
        used_jobs.add(j)
        running_cost+= cost
        step_no+= 1
        yield {"type": "step", "assignment": assignment[:], "best_value": running_cost, "step_no": step_no}
        if len(used_workers)==n:
            break

    yield {"type": "done", "assignment": assignment, "best_value": running_cost, "step_no": step_no+1}

def brute_force(cost_matrix, max_n=8):
    n= len(cost_matrix)
    if n>max_n:
        yield {"type": "done", "assignment": [], "best_value": -1, "step_no": 0, "error": f"Brute force capped at {max_n} workers (got {n})."}
        return
    best_cost, best_assignment= float("inf"), None
    step_no= 0
    for perm in itertools.permutations(range(n)):
        cost= sum(cost_matrix[i][perm[i]] for i in range(n))
        step_no+= 1
        if cost<best_cost:
            best_cost, best_assignment= cost, list(perm)
            yield {"type": "step", "assignment": best_assignment[:], "best_value": best_cost, "step_no": step_no}
    yield {"type": "done", "assignment": best_assignment, "best_value": best_cost, "step_no": step_no+1}

def branch_and_bound(cost_matrix, max_n=10):
    """DFS assigning workers one at a time to unused jobs. Bound = cost so
    far + sum of cheapest remaining job cost for each unassigned worker;
    prune if that can't beat current best."""
    n= len(cost_matrix)
    if n>max_n:
        yield {"type": "done", "assignment": [], "best_value": -1, "step_no": 0, "error": f"Branch & Bound capped at {max_n} workers (got {n})."}
        return
    best_cost, best_assignment= float("inf"), None
    step_no= 0
    def bound(worker_idx, used_jobs, cost_so_far):
        total= cost_so_far
        for i in range(worker_idx, n):
            cheapest= min(cost_matrix[i][j] for j in range(n) if j not in used_jobs)
            total+= cheapest
        return total
    stack= [(0, frozenset(), 0, [])]
    while stack:
        worker_idx, used_jobs, cost_so_far, assignment= stack.pop()
        step_no+=1
        if worker_idx== n:
            if cost_so_far<best_cost:
                best_cost, best_assignment= cost_so_far, assignment[:]
                yield {"type": "step", "assignment": best_assignment[:], "best_value": best_cost, "step_no": step_no}
            continue
        if bound(worker_idx, used_jobs, cost_so_far)>=best_cost:
            continue
        for j in range(n):
            if j in used_jobs:
                continue
            stack.append((
                worker_idx+1,
                used_jobs|{j},
                cost_so_far+cost_matrix[worker_idx][j],
                assignment+[j],
            ))
    yield {"type": "done", "assignment": best_assignment, "best_value": best_cost, "step_no": step_no+1}

def _find_zero_assignment(zero_mask):
    n= len(zero_mask)
    match_job_to_worker= [-1]*n
    def try_assign(worker, visited):
        for job in range(n):
            if zero_mask[worker][job] and not visited[job]:
                visited[job]= True
                if match_job_to_worker[job]== -1 or try_assign(match_job_to_worker[job], visited):
                    match_job_to_worker[job]= worker
                    return True
        return False
    for worker in range(n):
        visited= [False]*n
        try_assign(worker, visited)
    assignment= [-1]*n
    for job, worker in enumerate(match_job_to_worker):
        if worker != -1:
            assignment[worker]= job
    return assignment, all(a != -1 for a in assignment)

def _cover_zeros(zero_mask):
    n= len(zero_mask)
    assignment, _= _find_zero_assignment(zero_mask)
    matched_workers= {i for i, j in enumerate(assignment) if j != -1}
    visited_workers, visited_jobs= set(), set()
    def alternate(worker):
        visited_workers.add(worker)
        for job in range(n):
            if zero_mask[worker][job] and job not in visited_jobs:
                visited_jobs.add(job)
                matched_to= None
                for w, j in enumerate(assignment):
                    if j== job:
                        matched_to= w
                        break
                if matched_to is not None and matched_to not in visited_workers:
                    alternate(matched_to)
    unmatched= [i for i in range(n) if i not in matched_workers]
    for w in unmatched:
        alternate(w)
    covered_rows= [i for i in range(n) if i not in visited_workers]
    covered_cols= list(visited_jobs)
    return covered_rows, covered_cols, assignment

def hungarian_algorithm(cost_matrix, workers=None, jobs=None):
    n= len(cost_matrix)
    m= [row[:] for row in cost_matrix]
    step_no= 0
    for i in range(n):
        row_min= min(m[i])
        m[i]= [v-row_min for v in m[i]]
    step_no+=1
    yield {"type": "step", "matrix": copy.deepcopy(m), "step_no": step_no, "stage": "row reduction"}
    for j in range(n):
        col_min= min(m[i][j] for i in range(n))
        if col_min> 0:
            for i in range(n):
                m[i][j]-=col_min
    step_no+=1
    yield {"type": "step", "matrix": copy.deepcopy(m), "step_no": step_no, "stage": "column reduction"}
    for _ in range(n*n):
        zero_mask= [[m[i][j]== 0 for j in range(n)] for i in range(n)]
        covered_rows, covered_cols, assignment= _cover_zeros(zero_mask)
        num_lines= len(covered_rows)+len(covered_cols)
        step_no+= 1
        yield {
            "type": "step", "matrix": copy.deepcopy(m), "step_no": step_no, "stage": f"covering zeros ({num_lines}/{n} lines)",
        }
        if num_lines>=n:
            break
        uncovered_vals= [
            m[i][j] for i in range(n) for j in range(n)
            if i not in covered_rows and j not in covered_cols
        ]
        min_uncovered= min(uncovered_vals)
        for i in range(n):
            for j in range(n):
                if i not in covered_rows and j not in covered_cols:
                    m[i][j]-=min_uncovered
                elif i in covered_rows and j in covered_cols:
                    m[i][j]+=min_uncovered
        step_no+=1
        yield {"type": "step", "matrix": copy.deepcopy(m), "step_no": step_no, "stage": "adjusting matrix"}
    zero_mask= [[m[i][j]== 0 for j in range(n)] for i in range(n)]
    assignment, ok= _find_zero_assignment(zero_mask)
    best_cost= total_cost(cost_matrix, assignment) if ok else -1
    yield {"type": "done", "assignment": assignment, "best_value": best_cost, "step_no": step_no+1}

ALGORITHMS = {
    "greedy_assignment": greedy_assignment,
    "hungarian_algorithm": hungarian_algorithm,
    "brute_force": brute_force,
    "branch_and_bound": branch_and_bound,
}