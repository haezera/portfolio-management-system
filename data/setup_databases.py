import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os
import sys
from cycler import cycler

"""
Script usage: python3 setup_sql_tables.py <username> <password> <host name> <port> <db name>

Please run this script within the same directory.

You must set up a database. You can do this by running 'createdb <db name>' in your
terminal. I assume the vast majority of people (if anyone decides to run this project)
will be using local host on port 5432, which is the standard setting for PostgreSQL.
"""

username = str(sys.argv[1])
password = str(sys.argv[2])
hostname = str(sys.argv[3])
port = int(sys.argv[4])
dbname = str(sys.argv[5])

# database url
db_url = f'postgresql+psycopg2://{username}:{password}@{hostname}:{port}/{dbname}'

# attempt to establish a database connection
psql = create_engine(db_url)

# check the connection was successful
try:
    with psql.connect() as conn:
        print('PSQL: Database connection was successful ✅')
except Exception as e:
    print('PSQL: Database connection failed! Check your parameters ❌')
    print(f'Exception: {e}')
    exit(1)


# we now create the two necessary tables; end-of-month prices and end-of-month factor scores
eom_prices = """
create table if not exists eom_prices (
    date date,
    ticker text,
    price numeric(25, 10),
    volume bigint
);
"""

factor_scores = """
create table if not exists factor_scores (
    date date,
    ticker text,
    factor text,
    score numeric(10, 4)
);
"""

monthly_constituents = """
create table if not exists monthly_constituents (
    date date,
    ticker text,
    factor text,
    score numeric(10, 4)
);
"""

portfolio_data = """
CREATE TABLE portfolio_data (
    date date,
    ticker text,
    price double precision,
    volume bigint,
    "EVEBIT" double precision,
    "EVEBITDA" double precision,
    "MOMENTUM" double precision,
    "PB" double precision,
    "PE" double precision,
    "PS" double precision,
    sector text,
    index_weight double precision,
    index text,
    return double precision,
    t_plus_3_return double precision,
    estimated_vol double precision
);
"""

eom_prices_exists = False
factor_scores_exists = False
monthly_constituents_exists = False
portfolio_data_exists = False

try:
    check_table = """
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :table_name
    );
    """

    with psql.connect() as conn:
        for table in ["eom_prices", "factor_scores", "monthly_constituents", "portfolio_data"]:
            exists = conn.execute(text(check_table), {"table_name": table}).scalar()
            if exists:
                if table == 'eom_prices': eom_prices_exists = True
                elif table == 'factor_scores': factor_scores_exists = True
                elif table == 'monthly_constituents': monthly_constituents_exists = True
                elif table == 'portfolio_data': portfolio_data_exists = True
            else:
                print(f"PSQL: Table '{table}' did not exist, creating...")
                if table == "eom_prices":
                    conn.execute(text(eom_prices))
                elif table == 'factor_scores':
                    conn.execute(text(factor_scores))
                elif table == 'monthly_constituents':
                    conn.execute(text(monthly_constituents))
                elif table == 'portfolio_data':
                    conn.execute(text(portfolio_data))
except Exception as e:
    print('PSQL: Table creation failed ❌')
    print(f'Exception: {e}')
    exit(1)

# now we read in the dumps, and store them into the tables
if not eom_prices_exists:
    prices_data = pd.read_parquet('./dump/eom_prices.parquet')
    prices_data.to_sql('eom_prices', psql, if_exists='append', index=False)

if not factor_scores_exists:
    factor_data = pd.read_parquet('./dump/factor_scores.parquet')
    factor_data.to_sql('factor_scores', psql, if_exists='append', index=False)

if not monthly_constituents_exists:
    constituents_data = pd.read_parquet('./dump/monthly_constituents.parquet')
    constituents_data.to_sql('monthly_constituents', psql, if_exists='append', index=False)

if not portfolio_data_exists:
    portfolio_data_df = pd.read_parquet('./dump/portfolio_data.parquet')
    portfolio_data_df.to_sql('portfolio_data', psql, if_exists='append', index=False)

# finally, write to .env in the project root folder
# i assume you are running this from within the directory that
# this script is run in

env_path = os.path.join(os.path.dirname(__file__), "../.env")

try:
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(f"DB_URL={db_url}\n")
    print('.env: Saved DB_URL to .env. Make sure to not commit to your repo! ✅')
except Exception as e:
    print(f'Error: could not write .env file in project root folder ❌')
    print(f'Exception: {e}')