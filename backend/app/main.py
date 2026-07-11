import inspect

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .cities import get_national_cities, get_state_cities, get_available_states
from .manager import run_multiple
from . import algorithms as algo_module
from .knapsack_data import get_preset, get_preset_names
from .knapsack_manager import run_multiple_knapsack
from . import knapsack_algorithms as knapsack_module
from .assignment_data import get_preset as get_assignment_preset, get_preset_names as get_assignment_preset_names
from .assignment_manager import run_multiple_assignment
from . import assignment_algorithms as assignment_module

app= FastAPI(title="Visualizer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/cities/national")
def national_cities():
    return get_national_cities()

@app.get("/api/cities/states")
def states():
    return get_available_states()

@app.get("/api/cities/state/{state_name}")
def state_cities(state_name: str):
    return get_state_cities(state_name)

ALGO_LABELS= {
    "nearest_neighbor": "Nearest Neighbor (construction)",
    "random_paths": "Random Paths (exhaustive/baseline)",
    "brute_force": "Depth First Search/Brute Force (exhaustive, <=10 cities)",
    "branch_and_bound": "Branch & Bound: Cost (exhaustive, <=15 cities)",
}

@app.get("/api/algorithms")
def algorithms():
    return ALGO_LABELS

@app.get("/api/algorithm-code/{algo_name}")
def algorithm_code(algo_name: str):
    fn= algo_module.ALGORITHMS.get(algo_name)
    if fn is None:
        raise HTTPException(status_code=404, detail=f"Unknown algorithm '{algo_name}'")
    return {"algo": algo_name, "source": inspect.getsource(fn)}

@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket):
    await websocket.accept()
    try:
        payload= await websocket.receive_json()
        requests= payload["requests"]
        all_ids= set()
        for r in requests:
            all_ids.update(r["city_ids"])
        national= {c["id"]: c for c in get_national_cities()}
        state_lookup= {}
        for state in get_available_states():
            for c in get_state_cities(state):
                state_lookup[c["id"]]= c
        cities_by_id= {**national, **state_lookup}
        cities_by_id= {cid: cities_by_id[cid] for cid in all_ids if cid in cities_by_id}
        await run_multiple(websocket, requests, cities_by_id)
        await websocket.send_json({"type": "all_done"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

#KNAPSACK
KNAPSACK_ALGO_LABELS = {
    "fractional_knapsack": "Fractional Knapsack (greedy baseline)",
    "zero_one_dp": "0/1 Knapsack: Dynamic Programming",
    "brute_force": "Brute Force (all subsets, <=20 items)",
    "branch_and_bound": "Branch & Bound (fractional-relaxation bound, <=30 items)",
}

@app.get("/api/knapsack/presets")
def knapsack_presets():
    return get_preset_names()

@app.get("/api/knapsack/items/{preset_name}")
def knapsack_items(preset_name: str):
    return get_preset(preset_name)

@app.get("/api/knapsack/algorithms")
def knapsack_algorithms():
    return KNAPSACK_ALGO_LABELS

@app.get("/api/knapsack/algorithm-code/{algo_name}")
def knapsack_algorithm_code(algo_name: str):
    fn= knapsack_module.ALGORITHMS.get(algo_name)
    if fn is None:
        raise HTTPException(status_code=404, detail=f"Unknown algorithm '{algo_name}'")
    return {"algo": algo_name, "source": inspect.getsource(fn)}

@app.websocket("/ws/knapsack/run")
async def ws_knapsack_run(websocket: WebSocket):
    await websocket.accept()
    try:
        payload= await websocket.receive_json()
        requests= payload["requests"]
        items_by_id= {}
        for r in requests:
            for it in r.get("items", []):
                items_by_id[it["id"]]= it
        await run_multiple_knapsack(websocket, requests, items_by_id)
        await websocket.send_json({"type": "all_done"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

#ASSIGNMENT PROBLEM
ASSIGNMENT_ALGO_LABELS= {
    "greedy_assignment": "Greedy Assignment (construction heuristic)",
    "hungarian_algorithm": "Hungarian Algorithm (exact, Kuhn-Munkres)",
    "brute_force": "Brute Force (all permutations, <=8 workers)",
    "branch_and_bound": "Branch & Bound (row-min lower bound, <=10 workers)",
}

@app.get("/api/assignment/presets")
def assignment_presets():
    return get_assignment_preset_names()

@app.get("/api/assignment/data/{preset_name}")
def assignment_data(preset_name: str, size: int=8):
    data= get_assignment_preset(preset_name, size=size)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Unknown preset '{preset_name}'")
    return data

@app.get("/api/assignment/algorithms")
def assignment_algorithms():
    return ASSIGNMENT_ALGO_LABELS

@app.get("/api/assignment/algorithm-code/{algo_name}")
def assignment_algorithm_code(algo_name: str):
    fn= assignment_module.ALGORITHMS.get(algo_name)
    if fn is None:
        raise HTTPException(status_code=404, detail=f"Unknown algorithm '{algo_name}'")
    return {"algo": algo_name, "source": inspect.getsource(fn)}

@app.websocket("/ws/assignment/run")
async def ws_assignment_run(websocket: WebSocket):
    await websocket.accept()
    try:
        payload= await websocket.receive_json()
        requests= payload["requests"]
        await run_multiple_assignment(websocket, requests)
        await websocket.send_json({"type": "all_done"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass