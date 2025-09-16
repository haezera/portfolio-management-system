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

function Portfolio() {
  const [portfolioData, setPortfolioData] = useState();


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
      <p>View and manage your portfolio</p>
    </div>
  )
}

export default Portfolio