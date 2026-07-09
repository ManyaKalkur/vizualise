"""
0/1 and Fractional Knapsack algorithms, implemented as generators that
yield live progress.
Item shape: {"id", "name", "weight" (int), "value" (float)}
capacity: int
"""
import itertools

def zero_one_dp(items, capacity, throttle=1):
    """Classic bottom-up DP tabulation. 
    dp[i][w] = best value achievable using the first i items with capacity w.
    dp[i][capacity] is monotonic non-decreasing in i,
    so it doubles as a live 'current best' metric even mid-computation"""
    n= len(items)
    dp= [[0]*(capacity+1) for _ in range(n+1)]
    step_no= 0
    for i in range(1, n+1):
        w_i, v_i= items[i-1]["weight"], items[i-1]["value"]
        for w in range(0, capacity+1):
            if w_i<=w:
                dp[i][w]=max(dp[i-1][w], dp[i-1][w-w_i]+v_i)
            else:
                dp[i][w]=dp[i-1][w]
            step_no+=1
        yield {
            "type": "step",
            "item_index": i-1,
            "item_id": items[i-1]["id"],
            "best_value": dp[i][capacity],
            "step_no": step_no,
        }
    selected= []
    w= capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i-1][w]:
            selected.append(items[i-1]["id"])
            w-= items[i-1]["weight"]
    selected.reverse()
    yield {
        "type": "done",
        "best_value": dp[n][capacity],
        "selected_items": selected,
        "step_no": step_no+1,
    }

def fractional_knapsack(items, capacity):
    """Greedy by value/weight ratio."""
    ranked= sorted(items, key=lambda it: it["value"]/it["weight"], reverse=True)
    remaining= capacity
    total_value= 0.0
    selected= []
    step_no= 0
    for item in ranked:
        step_no+=1
        if remaining<=0:
            break
        take_weight=min(item["weight"], remaining)
        fraction=take_weight/item["weight"]
        total_value+=fraction*item["value"]
        remaining-=take_weight
        selected.append({"id": item["id"], "fraction": fraction})
        yield {
            "type": "step",
            "item_id": item["id"],
            "fraction": fraction,
            "best_value": total_value,
            "step_no": step_no,
        }
    yield {
        "type": "done",
        "best_value": total_value,
        "selected_items": selected,
        "step_no": step_no+1,
    }

def brute_force(items, capacity, max_items=20):
    """Try every subset (2^n). Only safe for small n."""
    n= len(items)
    if n>max_items:
        yield {"type": "done", "best_value": -1, "selected_items": [], "step_no": 0, "error": f"Brute force capped at {max_items} items (got {n})."}
        return
    best_value, best_subset= 0, []
    step_no=0
    for mask in range(1<<n):
        step_no+=1
        weight=sum(items[i]["weight"] for i in range(n) if (mask>>i)&1)
        if weight>capacity:
            continue
        value= sum(items[i]["value"] for i in range(n) if (mask>>i)&1)
        if value>best_value:
            best_value=value
            best_subset=[items[i]["id"] for i in range(n) if (mask>>i)&1]
            yield {"type": "step", "best_value": best_value, "step_no": step_no}
    yield {"type": "done", "best_value": best_value, "selected_items": best_subset, "step_no": step_no+1}

def branch_and_bound(items, capacity, max_items=30):
    """DFS with a fractional-relaxation upper bound for pruning: if
    that optimistic bound can't beat the current best, prune the branch."""
    n= len(items)
    if n>max_items:
        yield {"type": "done", "best_value":-1, "selected_items": [], "step_no":0, "error": f"Branch & Bound capped at {max_items} items (got {n})."}
        return
    ranked= sorted(range(n), key=lambda i: items[i]["value"]/items[i]["weight"], reverse=True)
    def bound(idx, cur_weight, cur_value):
        """Optimistic upper bound from index idx onward in ranked order."""
        if cur_weight>capacity:
            return 0
        total= cur_value
        w= cur_weight
        for j in range(idx, n):
            it= items[ranked[j]]
            if w+it["weight"]<=capacity:
                w+=it["weight"]
                total+=it["value"]
            else:
                remaining= capacity-w
                total+= it["value"]*(remaining/it["weight"])
                break
        return total
    best_value, best_subset= 0, []
    step_no= 0
    # stack entries: (index_in_ranked, cur_weight, cur_value, chosen_ids)
    stack= [(0, 0, 0, [])]
    while stack:
        idx, cur_weight, cur_value, chosen= stack.pop()
        step_no+= 1
        if cur_value>best_value and cur_weight<=capacity:
            best_value, best_subset=cur_value, chosen[:]
            yield {"type": "step", "best_value": best_value, "step_no": step_no}
        if idx== n:
            continue
        if bound(idx, cur_weight, cur_value)<= best_value:
            continue #prune
        item= items[ranked[idx]]
        # branch: include item
        if cur_weight+item["weight"]<=capacity:
            stack.append((idx+1, cur_weight+item["weight"], cur_value+item["value"], chosen+[item["id"]]))
        # branch: exclude item
        stack.append((idx+1, cur_weight, cur_value, chosen))
    yield {"type": "done", "best_value": best_value, "selected_items": best_subset, "step_no": step_no+1}

ALGORITHMS = {
    "fractional_knapsack": fractional_knapsack,
    "zero_one_dp": zero_one_dp,
    "brute_force": brute_force,
    "branch_and_bound": branch_and_bound,
}