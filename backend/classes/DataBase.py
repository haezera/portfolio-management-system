from sqlalchemy import create_engine, text
import pandas as pd
from typing import Tuple
from datetime import date
from dataclasses import dataclass

@dataclass
class DateBounds:
    max_date: date
    min_date: date

class PSQLDataBase:
    def __init__(self, db_url: str) -> None:
        self.psql = create_engine(db_url)

    def are_dates_valid(self, table: str, dates: list[str]) -> Tuple[list[bool], DateBounds]:
        max_date = pd.read_sql(f'select max(date) from {table}', self.psql).iloc[0, 0]
        min_date = pd.read_sql(f'select min(date) from {table}', self.psql).iloc[0, 0]
        res = []

        for d in dates:
            d_date = pd.to_datetime(d).date()
            res.append(min_date <= d_date <= max_date)

        return res, DateBounds(
            max_date = max_date,
            min_date = min_date
        )


    def fetch_between_dates(self, table_name: str, start_date: str | None, end_date: str | None, tickers: str | None) -> pd.DataFrame:
        conditions = []
        params = {}

        if start_date is not None:
            conditions.append("date >= :start_date")
            params['start_date'] = start_date
        if end_date is not None:
            conditions.append("date <= :end_date")
            params['end_date'] = end_date
        if tickers is not None and len(tickers) > 0:
            conditions.append("ticker IN :tickers")
            params['tickers'] = tuple(tickers)

        # create conditions if they exist - otherwise pull the entire
        # data table out.
        # we should rarely be pulling the entire table out. this will
        # be deterimental for performance.
        where_clause = ""
        if conditions:
            where_clause = " WHERE " + " AND ".join(conditions)

        # query from the postgresql database
        query = text(f"SELECT * FROM {table_name}{where_clause}")
        data = pd.read_sql(
            query, 
            self.psql, 
            params=params
        )
        
        return data