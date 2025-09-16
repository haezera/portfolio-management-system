import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input"
import DataTable from "@/components/DataTable"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// for charting stuff
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";

function Backtest() {
  const [backtestData, setBacktestData] = useState<any>();
  const [backtestID, setBacktestID] = useState<string>();
  const [backtestAnalytics, setBacktestAnalytics] = useState<string>();
  const [backtestAnalyticsData, setBacktestAnalyticsData] = useState<any>();
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [lookback, setLookback] = useState<number>();
  const [factors, setFactors] = useState<Set<string>>(new Set(["MOMENTUM", "EVEBITDA", "EVEBIT", "PS", "PB", "PE"]));
  const colorScale = scaleOrdinal(schemeCategory10);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  const handleFactorChange = (factor: string, checked: boolean) => {
    setFactors(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(factor);
      } else {
        newSet.delete(factor);
      }
      return newSet;
    });
  };
  const [overlayWeight, setOverlayWeight] = useState<number>();
  const [transactionCosts, setTransactionCosts] = useState<number>();

  const runBacktest = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/v1/backtest/backtest_between_dates", {
          start_date: startDate,
          end_date: endDate,
          lookback: lookback,
          factors: Array.from(factors),
          overlay_weight: overlayWeight,
          transaction_costs: transactionCosts
        }
      );
      const data = response.data;
      const backtest_id = data['backtest_id'];
      const backtest_results = data['results'];

      // set data
      setBacktestID(backtest_id);
      setBacktestData(backtest_results);
    } catch (err) {
      console.error("API Error: ", err);
    } finally {
      setLoading(false);
    }
  }

  const runBacktestAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      console.log(backtestID)
      const response = await axios.get(
        `http://localhost:8000/v1/backtest/analytics/${backtestAnalytics}`,
        {
          params: {
            backtest_id: backtestID
          }
        }
      );
      console.log(response.data);
      setBacktestAnalyticsData(response.data);
    } catch (err) {
      console.error("API Error: ", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  return (
        <div className="mt-20">
            <div className="mb-5">
                <h2 className="text-xl font-bold">Backtest</h2>
                <p> You can backtest the alpha extension strategy with your own parameters here.</p>
            </div>
            <div className="flex">
                <Input 
                    className="w-32 mr-2" 
                    value={startDate} 
                    placeholder="Start date"
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <Input 
                    className="w-32 mr-2" 
                    value={endDate} 
                    placeholder="End date"
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <Input 
                    type="number"
                    className="w-24 mr-2" 
                    value={overlayWeight} 
                    placeholder="Overlay"
                    onChange={(e) => setOverlayWeight(Number(e.target.value))}
                />
                <Input
                    type="number"
                    className="w-24 mr-2" 
                    value={transactionCosts} 
                    placeholder="T-costs"
                    onChange={(e) => setTransactionCosts(Number(e.target.value))}
                />
                <Input
                    type="number" 
                    className="w-24 mr-2" 
                    value={lookback} 
                    placeholder="Lookback"
                    onChange={(e) => setLookback(Number(e.target.value))}
                />
                <Button 
                    variant="outline"
                    onClick={runBacktest}
                    disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Fetch"}
                </Button>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <Switch 
                id="MOMENTUM" defaultChecked 
                onCheckedChange={(checked) => handleFactorChange("MOMENTUM", checked)} 
              />
              <Label htmlFor="MOMENTUM">MOMENTUM</Label>
              <Switch 
                id="EVEBITDA" defaultChecked 
                onCheckedChange={(checked) => handleFactorChange("EVEBITDA", checked)} 
              />
              <Label htmlFor="EVEBITDA">EVEBITDA</Label>
              <Switch 
                id="EVEBIT" defaultChecked 
                onCheckedChange={(checked) => handleFactorChange("EVEBIT", checked)} 
              />
              <Label htmlFor="EVEBIT">EVEBIT</Label>
              <Switch 
                id="PS" defaultChecked 
                onCheckedChange={(checked) => handleFactorChange("PS", checked)} 
              />
              <Label htmlFor="PS">P/S</Label>
              <Switch id="PB" defaultChecked 
                onCheckedChange={(checked) => handleFactorChange("PB", checked)} 
              />
              <Label htmlFor="PB">P/B</Label>
              <Switch id="PE" defaultChecked 
                onCheckedChange={(checked) => handleFactorChange("PE", checked)} 
              />
              <Label htmlFor="PE">P/E</Label>
            </div>
                  <div className="flex flex-col m-10 justify-center">
                    <LineChart
                      key={Date.now()}
                      width={900}
                      height={500}
                      data={backtestData}
                    >
                      <CartesianGrid />
                      <Line 
                        key="cum_portfolio" 
                        dot={false}
                        dataKey="cum_portfolio"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={2500}
                        stroke={colorScale(0)}
                      />
                      <Line 
                        key="cum_passive" 
                        dot={false}
                        dataKey="cum_passive"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={2500}
                        stroke={colorScale(1)}
                      />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Legend />
                    </LineChart>
                  </div>
                {backtestData && (
                  <div className="flex">
                  <Select onValueChange={(value) => setBacktestAnalytics(value)}>
                      <SelectTrigger className="w-[250px] mr-2">
                          <SelectValue placeholder="Backtest analytics" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="beta_exposure">Beta exposure</SelectItem>
                          <SelectItem value="factor_exposure">Factor exposure</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button 
                    variant="outline"
                    onClick={runBacktestAnalytics}
                    disabled={analyticsLoading}
                  >
                    {analyticsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Fetch"}
                  </Button>
                  </div>
                )}
                {
                  backtestAnalyticsData && (
                    <div className="flex flex-col m-10 justify-center">
                      <LineChart
                        key="backtest_analytics"
                        width={900}
                        height={500}
                        data={backtestAnalyticsData}
                      >
                        <CartesianGrid />
                        { Object.keys(backtestAnalyticsData[0] || {}).filter(k => k !== "date").map((key, idx) => (
                          <Line
                            key={key}
                            dot={false}
                            dataKey={key}
                            strokeWidth={2}
                            isAnimationActive={true}
                            animationDuration={2500}
                            stroke={colorScale(idx)}
                          />
                        ))}
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Legend />
                      </LineChart>
                    </div>
                  )
                }
        </div>
  )
}

export default Backtest