import asyncio
import time

from .knapsack_algorithms import ALGORITHMS

async def run_knapsack_stream(websocket, run_id: str, algo_name: str, items: list, capacity: int):
    gen_fn= ALGORITHMS[algo_name]
    generator= gen_fn(items, capacity)
    t0= time.perf_counter()
    for step in generator:
        elapsed_ms= (time.perf_counter()-t0)*1000
        message= {"run_id": run_id, "algo": algo_name, "elapsed_ms": elapsed_ms, **step}
        await websocket.send_json(message)
        await asyncio.sleep(0)
    total_ms= (time.perf_counter()-t0)*1000
    await websocket.send_json({"run_id": run_id, "algo": algo_name, "type": "finished", "elapsed_ms": total_ms})

async def run_multiple_knapsack(websocket, requests: list, items_by_id: dict):
    tasks= []
    for req in requests:
        items= [items_by_id[iid] for iid in req["item_ids"]]
        capacity= req["capacity"]
        await websocket.send_json({
            "run_id": req["run_id"],
            "algo": req["algo"],
            "type": "meta",
            "num_items": len(items),
            "possible_subsets": 2**len(items),
        })
        tasks.append(asyncio.create_task(
            run_knapsack_stream(websocket, req["run_id"], req["algo"], items, capacity)
        ))
    await asyncio.gather(*tasks)