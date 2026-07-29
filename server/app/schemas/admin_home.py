from pydantic import BaseModel


class StatPair(BaseModel):
    current: int
    previous: int | None


class LineChartPoint(BaseModel):
    month: str
    quizzes: int


class DonutChartSlice(BaseModel):
    name: str
    value: int


class AdminStatsResponse(BaseModel):
    totalUsers: StatPair
    quizzesGenerated: StatPair
    downloadedQuizzes: StatPair
    lineChart: list[LineChartPoint]
    donutChart: list[DonutChartSlice]