import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import trainMetadata from './data/train_metadata.json';
import scatterData from './data/scatter_data.json';

interface Metadata {
  [key: string]: number;
}

interface ScatterMetadata {
  [key: string]: number[];  // [number, number] 대신 number[]를 사용
}

function App() {
  const [barData, setBarData] = useState<{x: number[], y: number[]}>({x: [], y: []});
  const [scatterPlotData, setScatterPlotData] = useState<{x: number[], y: number[]}>({x: [], y: []});
  const [dataSummary, setDataSummary] = useState<string>('');
  const [colors, setColors] = useState<string[]>([]);
  const [hoverTexts, setHoverTexts] = useState<string[]>([]);
  const [plotRange, setPlotRange] = useState<[number, number]>([0, 0]);
  const [isHistogram, setIsHistogram] = useState<boolean>(true);

  useEffect(() => {
    const metadata = trainMetadata.metadata as Metadata;
    const fileSizes = Object.values(metadata);

    // Histogram data preparation
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
    for (const value of Object.values(scatterMetadata)) {
      scatterX.push(value[0]);
      scatterY.push(value[1]);
    }
    setScatterPlotData({x: scatterX, y: scatterY});
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
                  type: 'scattergl',  // 'scatter' 대신 'scattergl' 사용
                  mode: 'markers',
                  marker: {
                    color: 'rgba(75, 192, 192, 0.7)',
                    size: 5,  // 마커 크기를 작게 설정
                  },
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
            hovermode: 'closest',  // 가장 가까운 점에 대한 호버 정보 표시
          }}
          config={{
            responsive: true,
            scrollZoom: true,  // 스크롤로 줌 가능하게 설정
          }}
        />
      </header>
    </div>
  );
}

export default App;
