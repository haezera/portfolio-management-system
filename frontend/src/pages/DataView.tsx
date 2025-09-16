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

function DataView() {
    const [table, setTable] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [data, setData] = useState<any[]>([]);

    const handleFetch = async () => {
        if (!table) return;
        try {
            const response = await axios.post("http://localhost:8000/v1/data/pull_between_dates", {
                table_name: table,
                start_date: "2020-01-01",
                end_date: "2020-12-31",
                tickers: null,
            })
            setData(response.data);
        } catch (err) {
            console.error("API error:", err)
        }
    }


    return (
        <div className="mt-20">
            <div className="mb-5">
                <h2 className="text-xl font-bold">Data view</h2>
                <p>Data view is a tool for examining data points in the database, raining across prices,
                    factor scores and constituents data. Express dates in YYYY-mm-dd format (e.g 2024-01-01) </p>
            </div>
            <div className="flex">
                <Select onValueChange={(value) => setTable(value)}>
                    <SelectTrigger className="w-[180px] mr-2">
                        <SelectValue placeholder="Database" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="eom_prices">End-of-month prices</SelectItem>
                        <SelectItem value="factor_scores">Factor scores</SelectItem>
                        <SelectItem value="monthly_constituents">Monthly Constituents</SelectItem>
                    </SelectContent>
                </Select>
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
                <Button 
                    variant="outline"
                    onClick={handleFetch}
                >
                    Fetch
                </Button>
            </div>
            {data.length > 0 && <DataTable data={data} />}
        </div>
    )
}

export default DataView