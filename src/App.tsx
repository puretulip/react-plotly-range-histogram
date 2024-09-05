import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import trainMetadata from './data/train_metadata.json';

interface Metadata {
  [key: string]: number;
}

function App() {
  const [fileSizes, setFileSizes] = useState<number[]>([]);

  useEffect(() => {
    // JSON 파일에서 파일 크기 데이터 추출
    const metadata = trainMetadata.metadata as Metadata;
    const extractedSizes = Object.values(metadata);
    setFileSizes(extractedSizes);
  }, []);

  const minSize = Math.min(...fileSizes);
  const maxSize = Math.max(...fileSizes);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MNIST File Size Distribution</h1>
        <Plot
          data={[
            {
              x: fileSizes,
              type: 'histogram',
              marker: {color: 'rgba(75, 192, 192, 0.7)'},
              xbins: {
                start: minSize - 0.5,
                end: maxSize + 0.5,
                size: 1
              },
            },
          ]}
          layout={{
            width: 720,
            height: 480,
            title: 'MNIST File Size Histogram',
            xaxis: {
              title: 'File Size',
              showticklabels: false, // x축 눈금 레이블 숨기기
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
