from dataclasses import dataclass


@dataclass
class MetricModel:
    user_id: str
    date: str
    name: str
    value: float
