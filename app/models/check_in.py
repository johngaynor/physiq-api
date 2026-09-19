from dataclasses import dataclass


@dataclass
class CheckInModel:
    user_id: str
    date: str
    comments: str
