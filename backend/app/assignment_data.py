DELIVERY_RIDERS= {
    "workers": ["Rider A", "Rider B", "Rider C", "Rider D", "Rider E", "Rider F", "Rider G", "Rider H"],
    "jobs": ["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6", "Route 7", "Route 8"],
    "cost_matrix": [
        [12, 19, 8, 15, 22, 9, 14, 20],
        [10, 14, 13, 9, 18, 16, 11, 17],
        [16, 8, 19, 12, 10, 21, 15, 9],
        [9, 15, 11, 18, 14, 8, 20, 13],
        [21, 10, 16, 8, 19, 13, 9, 15],
        [14, 18, 9, 16, 11, 20, 8, 12],
        [8, 13, 17, 10, 15, 9, 19, 14],
        [17, 9, 14, 20, 8, 15, 12, 18],
    ],
}

WORKERS_PROJECTS= {
    "workers": ["Alice", "Bob", "Chen", "Deepa", "Emre", "Fatima", "Gopal", "Hana"],
    "jobs": ["Backend", "Frontend", "ML Model", "DevOps", "QA", "Design", "Docs", "Mobile"],
    "cost_matrix": [
        [4, 9, 7, 8, 10, 12, 6, 9],
        [8, 5, 11, 6, 9, 10, 7, 8],
        [6, 10, 4, 9, 8, 11, 9, 7],
        [9, 7, 8, 5, 10, 9, 6, 11],
        [7, 8, 9, 10, 5, 6, 11, 9],
        [10, 9, 6, 7, 8, 4, 9, 10],
        [5, 11, 10, 9, 7, 8, 4, 6],
        [9, 6, 8, 11, 9, 7, 8, 5],
    ],
}

PRESETS= {
    "delivery_riders": DELIVERY_RIDERS,
    "workers_projects": WORKERS_PROJECTS,
}

def get_preset(name: str, size: int= None):
    data= PRESETS.get(name)
    if data is None:
        return None
    n= size or len(data["workers"])
    n= min(n, len(data["workers"]))
    return {
        "workers": data["workers"][:n],
        "jobs": data["jobs"][:n],
        "cost_matrix": [row[:n] for row in data["cost_matrix"][:n]],
    }

def get_preset_names():
    return list(PRESETS.keys())