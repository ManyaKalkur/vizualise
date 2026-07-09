import asyncio
import time

from .assignment_algorithms import ALGORITHMS

async def run_assignment_stream(websocket, run_id: str, algo_name: str, cost_matrix: list):
    gen_fn= ALGORITHMS[algo_name]
    generator= gen_fn(cost_matrix)
    t0= time.perf_counter()
    for step in generator:
        elapsed_ms= (time.perf_counter()-t0)*1000
        message= {"run_id": run_id, "algo": algo_name, "elapsed_ms": elapsed_ms, **step}
        await websocket.send_json(message)
        await asyncio.sleep(0)
    total_ms= (time.perf_counter()-t0)*1000
    await websocket.send_json({"run_id": run_id, "algo": algo_name, "type": "finished", "elapsed_ms": total_ms})

async def run_multiple_assignment(websocket, requests: list):
    tasks= []
    for req in requests:
        n= len(req["cost_matrix"])
        await websocket.send_json({
            "run_id": req["run_id"],
            "algo": req["algo"],
            "type": "meta",
            "n": n,
            "possible_assignments": _factorial(n),
        })
        tasks.append(asyncio.create_task(
            run_assignment_stream(websocket, req["run_id"], req["algo"], req["cost_matrix"])
        ))
    await asyncio.gather(*tasks)

def _factorial(n):
    result= 1
    for i in range(2, n+1):
        result*= i
    return result