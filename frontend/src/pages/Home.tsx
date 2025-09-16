import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";

// for charting stuff
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { scaleSequential } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";

function Home() {
  const [priceData, setPriceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const backend = import.meta.env.VITE_BACKEND_API
  const tickers = ["GOOG", "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "META"]
  const colorScale = scaleSequential(interpolateViridis).domain([0, tickers.length - 1]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(
          `${backend}/v1/data/pull_between_dates`,
          {
            table_name: "eom_prices",
            start_date: "2001-01-01",
            end_date: "2025-08-31",
            tickers: tickers,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const raw = res.data;
        const groupedPrice: Record<string, any> = {};

        raw.forEach((row: any) => {
          if (!groupedPrice[row.date]) {
            groupedPrice[row.date] = { date: row.date };
          }
          groupedPrice[row.date][row.ticker] = row.price;
        });

        setPriceData(Object.values(groupedPrice));
      } catch (err: any) {
        setError(err.message || "Unknown error");
        console.log(err);
      }
    };
    fetchData();
  }, []);

  console.log(priceData)

  return (
    <div>
      <p className="mt-20">Hello, and welcome to the portfolio management system.</p>
      <p>See below for information about what this project does, and how to utilise it.</p>
      
      <div className="flex flex-col m-10 justify-center">
        <LineChart
          key={Date.now()} // i need this to reanime every time
          width={600}
          height={300}
          data={priceData}
        >
          <CartesianGrid />
          {tickers.map((ticker, idx) => (
            <Line
              key={ticker}
              type="monotone"
              dot={false}
              dataKey={ticker}
              strokeWidth={2}
              stroke={colorScale(idx)}
              isAnimationActive={true}
              animationDuration={2500}
            />
          ))}
          <XAxis dataKey="date" />
          <YAxis />
          <Legend />
        </LineChart>
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="pl-3 hover:text-orange-300 rounded">
          <AccordionTrigger className="justify-start">What is this project?</AccordionTrigger>
          <AccordionContent className="text-black">
            This project is a web app which is intended to assist portfolio managers who trade using 
            the alpha extension strategy that is contained <a href="https://github.com/haezera/quant-strats-in-us-equities" 
                className="text-blue-400"
                target = "_blank"
            >
              here
            </a>. It is powered by a Python FastAPI backend, which deals with the modelling and data engineering
            required for the project.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="pl-3 hover:text-orange-300 rounded">
          <AccordionTrigger className="justify-start">How do I set up the project so I can run it myself?</AccordionTrigger>
          <AccordionContent className="text-black">
            There are some pretty extensive setup steps that are detailed in the project. You are required to set up 
            your own PostgreSQL database, and then follow the instructions/script <a href="https://github.com/haezera/portfolio-management-system/blob/main/data/setup_databases.py" 
                className="text-blue-400"
                target = "_blank"
            >
              here
            </a> to populate your database with the necessary data. Afterwards, you should be able to run this frontend locally,
            as well as the backend in separate terminals, and hopefully everything works!
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="pl-3 hover:text-orange-300 rounded">
          <AccordionTrigger className="justify-start">What can I do in the portfolio management system?</AccordionTrigger>
          <AccordionContent className="text-black">
            There are currently a few different available functionalities in the project.
            <ul className="list-disc pl-6">
              <li>Viewing milion+ rows of data, available in 'Data View'.</li>
              <li>Backtesting the strategy, in 'Backtest'</li>
              <li>Having a granular view of the constituents in the porfolio for each end-of-month date, in 'Portfolio'</li>
            </ul>
            The backtest has a simple vectorised month-to-month rebalancing backtest, as well as backtest analytics for the portfolio 
            like realised beta, factor exposures and more.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default Home