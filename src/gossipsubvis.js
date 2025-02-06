import React, { useState, useEffect } from "react";
import { Graph } from "react-d3-graph";

const GossipsubVisualizer = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Read the log file
        const res = await fetch("./log.txt");
        const text = await res.text();

        // Parse the logs into nodes and links
        console.log("fetching");
        const lines = text.split("\n");
        console.log(lines.length);
        const nodes = new Set();
        const links = [];
        let currentStep = 0;

        lines.forEach((line) => {
          const match = line.match(/\b(16Uiu2\w+)\b/g);
          if (match) {
            match.forEach((id) => nodes.add(id));
          }
          if (line.includes("rpc.from")) {
            const [to] = match;
            const sourceMatch = line.match(/"sourcePeerId":"(16Uiu2\w+)"/);
            const source = sourceMatch ? sourceMatch[1] : "unknown";

            const link = { source, target: to, step: currentStep };
            console.log(currentStep, link);
            links.push(link);
            currentStep++;
          }
        });

        setData({
          nodes: Array.from(nodes).map((id) => ({ id })),
          links,
        });
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    fetchData();
  }, []);

  // Configure graph
  const graphConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: "lightgreen",
      size: 120,
      highlightStrokeColor: "blue",
    },
    link: {
      highlightColor: "lightblue",
    },
    d3: {
      alphaTarget: 0.05,
      gravity: -100,
      linkLength: 100,
      linkStrength: 1,
    },
  };

  // Get links for current step
  const stepLinks = data.links.filter((link) => link.step <= step);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gossipsub Message Propagation</h2>
      <div className="h-96 mb-4">
        <Graph
          id="graph-id"
          data={{ nodes: data.nodes, links: stepLinks }}
          config={graphConfig}
        />
      </div>
      <input
        type="range"
        min="0"
        max={data.links.length}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="mt-2 text-sm text-gray-500">
        Showing message propagation at step {step} of {data.links.length}
      </div>
    </div>
  );
};

export default GossipsubVisualizer;
