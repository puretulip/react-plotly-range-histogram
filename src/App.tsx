import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import trainMetadata from './data/train_metadata.json';
import scatterData from './data/scatter_data.json';

interface Metadata {
  [key: string]: number;
}

interface ScatterMetadata {
  [key: string]: number[];
}

function App() {
  const [barData, setBarData] = useState<{x: number[], y: number[]}>({x: [], y: []});
  const [scatterPlotData, setScatterPlotData] = useState<{
    x: number[],
    y: number[],
    colors: string[],
    hoverTexts: string[]
  }>({x: [], y: [], colors: [], hoverTexts: []});
  const [dataSummary, setDataSummary] = useState<string>('');
  const [colors, setColors] = useState<string[]>([]);
  const [hoverTexts, setHoverTexts] = useState<string[]>([]);
  const [plotRange, setPlotRange] = useState<[number, number]>([0, 0]);
  const [isHistogram, setIsHistogram] = useState<boolean>(true);

  useEffect(() => {
    const metadata = trainMetadata.metadata as Metadata;
    const fileSizes = Object.values(metadata);

    const minSize = Math.min(...fileSizes);
    const maxSize = Math.max(...fileSizes);
    const binCount = 20;
    const binSize = Math.ceil((maxSize - minSize + 1) / binCount);

    const bins: number[] = Array.from({length: binCount}, (_, i) => minSize + i * binSize);
    const counts = new Array(binCount).fill(0);

    // Create a map to store bin index for each file
    const fileToBinMap = new Map<string, number>();

    Object.entries(metadata).forEach(([key, size]) => {
      const binIndex = Math.min(Math.floor((size - minSize) / binSize), binCount - 1);
      counts[binIndex]++;
      fileToBinMap.set(key, binIndex);
    });

    setBarData({x: bins, y: counts});
    setPlotRange([minSize, maxSize + binSize]);

    const newColors = Array.from({length: binCount}, (_, i) => 
      `hsl(${(i * 360 / binCount) % 360}, 70%, 50%)`
    );
    setColors(newColors);

    const newHoverTexts = bins.map((start, i) => {
      const end = i < binCount - 1 ? bins[i + 1] : maxSize + 1;
      return `[${start.toFixed(2)}, ${end.toFixed(2)}) <br>Count: ${counts[i]}`;
    });
    setHoverTexts(newHoverTexts);

    const avgSize = fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length;
    const summary = `Min: ${minSize}, Max: ${maxSize}, Avg: ${avgSize.toFixed(2)}, Count: ${fileSizes.length}`;
    setDataSummary(summary);

    // Scatter plot data preparation
    const scatterMetadata = scatterData.metadata as ScatterMetadata;
    const scatterX = [];
    const scatterY = [];
    const scatterColors = [];
    const scatterHoverTexts = [];
    for (const [key, value] of Object.entries(scatterMetadata)) {
      scatterX.push(value[0]);
      scatterY.push(value[1]);
      const binIndex = fileToBinMap.get(key) || 0;
      scatterColors.push(newColors[binIndex]);
      scatterHoverTexts.push(`Key: ${key}<br>X: ${value[0]}<br>Y: ${value[1].toFixed(4)}`);
    }
    setScatterPlotData({
      x: scatterX,
      y: scatterY,
      colors: scatterColors,
      hoverTexts: scatterHoverTexts
    });
  }, []);

  const togglePlotType = () => {
    setIsHistogram(!isHistogram);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>{dataSummary}</p>
        <button onClick={togglePlotType}>
          {isHistogram ? 'Switch to Scatter Plot' : 'Switch to Histogram'}
        </button>
        <Plot
          data={[
            isHistogram
              ? {
                  x: barData.x,
                  y: barData.y,
                  type: 'bar',
                  marker: {color: colors},
                  hoverinfo: 'text',
                  hovertext: hoverTexts,
                }
              : {
                  x: scatterPlotData.x,
                  y: scatterPlotData.y,
                  type: 'scattergl',
                  mode: 'markers',
                  marker: {
                    color: scatterPlotData.colors,
                    size: 5,
                  },
                  hoverinfo: 'text',
                  hovertext: scatterPlotData.hoverTexts,
                }
          ]}
          layout={{
            width: 1000,
            height: 600,
            title: isHistogram ? 'File Size Histogram' : 'File Size Scatter Plot',
            xaxis: {
              title: 'File Size',
              tickformat: '.0f',
              range: isHistogram ? plotRange : undefined,
            },
            yaxis: {
              title: isHistogram ? 'Frequency' : 'Random Value',
            },
            bargap: 0.1,
            hovermode: 'closest',
          }}
          config={{
            responsive: true,
            scrollZoom: true,
          }}
        />
      </header>
    </div>
  );
}

export default App;
