import React, { useState, useEffect } from "react";
import { Graph } from "react-d3-graph";

const GossipsubVisualizer = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [step, setStep] = useState(0);
  // Add a new state for storing the peer ID to alias mapping
  const [peerAliases, setPeerAliases] = useState(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Read the log file
        const res = await fetch("./log.txt");
        const text = await res.text();
        const lines = text.split("\n");
        const nodes = new Set();
        const links = [];
        let currentStep = 0;

        // First pass: collect all unique peer IDs
        lines.forEach((line) => {
          const match = line.match(/\b(16Uiu2\w+)\b/g);
          if (match) {
            match.forEach((id) => nodes.add(id));
          }
        });

        // Create aliases for each peer ID
        const aliases = new Map();
        Array.from(nodes).forEach((id, index) => {
          aliases.set(id, `Node ${index + 1}`);
        });
        setPeerAliases(aliases);

        // Second pass: create links
        lines.forEach((line) => {
          const match = line.match(/\b(16Uiu2\w+)\b/g);
          if (line.includes("rpc.from") && match) {
            const [to] = match;
            const sourceMatch = line.match(/"sourcePeerId":"(16Uiu2\w+)"/);
            const source = sourceMatch ? sourceMatch[1] : "unknown";
            const link = { source, target: to, step: currentStep };
            links.push(link);
            currentStep++;
          }
        });

        setData({
          nodes: Array.from(nodes).map((id) => ({
            id,
            // Add the alias as a separate property
            alias: aliases.get(id),
          })),
          links,
        });
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };
    fetchData();
  }, []);

  // Configure graph with custom node label
  const graphConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: "lightgreen",
      size: 120,
      highlightStrokeColor: "blue",
      // Override the default label with the alias
      labelProperty: "alias",
      // Customize label styling
      labelPosition: "center",
      fontSize: 12,
      fontWeight: "bold",
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

      {/* Optional: Add a legend showing the mapping */}
      <div className="mt-4 text-sm">
        <h3 className="font-bold mb-2">Node ID Mapping</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from(peerAliases).map(([peerId, alias]) => (
            <div key={peerId} className="text-gray-600">
              {alias}: {peerId.slice(0, 8)}...
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GossipsubVisualizer;
