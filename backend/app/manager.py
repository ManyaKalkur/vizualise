import asyncio
import time
from .algorithms import ALGORITHMS, build_distance_matrix, num_possible_tours

TRACE_CAPABLE = {"nearest_neighbor", "brute_force", "branch_and_bound"}
async def run_algorithm_stream(websocket, run_id: str, algo_name: str, cities: list, start_idx: int, trace: bool = False):
    dist= build_distance_matrix(cities)
    gen_fn= ALGORITHMS[algo_name]
    kwargs= {"start_idx": start_idx}
    if trace and algo_name in TRACE_CAPABLE:
        kwargs["trace"]= True
    generator = gen_fn(cities, dist, **kwargs)
    t0= time.perf_counter()
    for step in generator:
        elapsed_ms= (time.perf_counter()-t0)*1000
        message= {
            "run_id":run_id,
            "algo":algo_name,
            "elapsed_ms":elapsed_ms,
            **step,
        }
        if "tour" in message and message["tour"]:
            message["tour"]= [cities[i]["id"] for i in message["tour"]]
        await websocket.send_json(message)
        await asyncio.sleep(0)
    total_ms= (time.perf_counter()-t0)*1000
    await websocket.send_json({
        "run_id":run_id,
        "algo":algo_name,
        "type":"finished",
        "elapsed_ms":total_ms,
    })

async def run_multiple(websocket,requests:list,cities_by_id:dict):
    tasks= []
    for req in requests:
        cities= [cities_by_id[cid] for cid in req["city_ids"]]
        start_idx= None
        for i, c in enumerate(cities):
            if c["id"]== req["start_id"]:
                start_idx= i
                break
        if start_idx is None:
            raise ValueError(
                f"Start city '{req['start_id']}' is not in the selected cities for {req['run_id']}. "
                "Pick a start city that's still checked in the city list."
            )
        await websocket.send_json({
            "run_id":req["run_id"],
            "algo":req["algo"],
            "type":"meta",
            "num_cities":len(cities),
            "possible_tours":num_possible_tours(len(cities)),
        })
        tasks.append(
            asyncio.create_task(
                run_algorithm_stream(websocket,req["run_id"],req["algo"],cities,start_idx,trace=req.get("trace", False))
            )
        )
    await asyncio.gather(*tasks)