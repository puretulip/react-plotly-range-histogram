import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import trainMetadata from './data/train_metadata.json';

interface Metadata {
  [key: string]: number;
}

function App() {
  const [barData, setBarData] = useState<{x: number[], y: number[]}>({x: [], y: []});
  const [dataSummary, setDataSummary] = useState<string>('');
  const [colors, setColors] = useState<string[]>([]);
  const [hoverTexts, setHoverTexts] = useState<string[]>([]);
  const [plotRange, setPlotRange] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const metadata = trainMetadata.metadata as Metadata;
    const fileSizes = Object.values(metadata);

    const minSize = Math.min(...fileSizes);
    const maxSize = Math.max(...fileSizes);
    const binCount = 20;
    const binSize = Math.ceil((maxSize - minSize + 1) / binCount);

    const bins: number[] = Array.from({length: binCount}, (_, i) => minSize + i * binSize);
    const counts = new Array(binCount).fill(0);

    fileSizes.forEach(size => {
      const binIndex = Math.min(Math.floor((size - minSize) / binSize), binCount - 1);
      counts[binIndex]++;
    });

    setBarData({x: bins, y: counts});
    setPlotRange([minSize, maxSize + binSize]);

    // 각 빈에 대한 고유한 색상 생성
    const newColors = Array.from({length: binCount}, (_, i) => 
      `hsl(${(i * 360 / binCount) % 360}, 70%, 50%)`
    );
    setColors(newColors);

    // 호버 텍스트 생성
    const newHoverTexts = bins.map((start, i) => {
      const end = i < binCount - 1 ? bins[i + 1] : maxSize + 1;
      return `[${start.toFixed(2)}, ${end.toFixed(2)}) <br>Count: ${counts[i]}`;
    });
    setHoverTexts(newHoverTexts);

    const avgSize = fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length;
    const summary = `Min: ${minSize}, Max: ${maxSize}, Avg: ${avgSize.toFixed(2)}, Count: ${fileSizes.length}`;
    setDataSummary(summary);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>{dataSummary}</p>
        <Plot
          data={[
            {
              x: barData.x,
              y: barData.y,
              type: 'bar',
              marker: {color: colors},
              hoverinfo: 'text',
              hovertext: hoverTexts,
            },
          ]}
          layout={{
            width: 1000,
            height: 600,
            title: '',
            xaxis: {
              title: 'File Size',
              tickformat: '.0f',
              range: plotRange,
            },
            yaxis: {title: 'Frequency'},
            bargap: 0.1,
          }}
        />
      </header>
    </div>
  );
}

export default App;
