TREKKING_GEAR= [
    {"id": "K01", "name": "Tent", "weight": 8, "value": 90},
    {"id": "K02", "name": "Sleeping Bag", "weight": 4, "value": 60},
    {"id": "K03", "name": "Water Filter", "weight": 1, "value": 55},
    {"id": "K04", "name": "Stove", "weight": 3, "value": 45},
    {"id": "K05", "name": "Food Rations", "weight": 6, "value": 70},
    {"id": "K06", "name": "First Aid Kit", "weight": 2, "value": 65},
    {"id": "K07", "name": "Rope (30m)", "weight": 5, "value": 40},
    {"id": "K08", "name": "Camera", "weight": 2, "value": 35},
    {"id": "K09", "name": "Power Bank", "weight": 1, "value": 30},
    {"id": "K10", "name": "Rain Jacket", "weight": 2, "value": 50},
    {"id": "K11", "name": "Trekking Poles", "weight": 3, "value": 25},
    {"id": "K12", "name": "Extra Clothes", "weight": 4, "value": 20},
    {"id": "K13", "name": "Binoculars", "weight": 1, "value": 15},
    {"id": "K14", "name": "Portable Chair", "weight": 5, "value": 18},
    {"id": "K15", "name": "Solar Panel", "weight": 3, "value": 42},
]

ELECTRONICS_HAUL= [
    {"id": "E01", "name": "Laptop", "weight": 3, "value": 100},
    {"id": "E02", "name": "DSLR Camera", "weight": 2, "value": 85},
    {"id": "E03", "name": "Drone", "weight": 4, "value": 95},
    {"id": "E04", "name": "Tablet", "weight": 1, "value": 55},
    {"id": "E05", "name": "Headphones", "weight": 1, "value": 30},
    {"id": "E06", "name": "Smartwatch", "weight": 1, "value": 40},
    {"id": "E07", "name": "External SSD", "weight": 1, "value": 25},
    {"id": "E08", "name": "Speaker", "weight": 2, "value": 35},
    {"id": "E09", "name": "Monitor", "weight": 5, "value": 60},
    {"id": "E10", "name": "Keyboard", "weight": 1, "value": 15},
    {"id": "E11", "name": "Mouse", "weight": 1, "value": 10},
    {"id": "E12", "name": "Router", "weight": 2, "value": 20},
]

PRESETS= {
    "trekking_gear": TREKKING_GEAR,
    "electronics_haul": ELECTRONICS_HAUL,
}

def get_preset(name: str):
    return PRESETS.get(name, [])

def get_preset_names():
    return list(PRESETS.keys())