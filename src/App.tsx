import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import trainMetadata from './data/train_metadata.json';

interface Metadata {
  [key: string]: number;
}

function App() {
  const [fileSizes, setFileSizes] = useState<number[]>([]);
  const [dataSummary, setDataSummary] = useState<string>('');

  useEffect(() => {
    // JSON 파일에서 파일 크기 데이터 추출
    const metadata = trainMetadata.metadata as Metadata;
    const extractedSizes = Object.values(metadata);
    setFileSizes(extractedSizes);

    // 데이터 요약 정보 생성
    const minSize = Math.min(...extractedSizes);
    const maxSize = Math.max(...extractedSizes);
    const avgSize = extractedSizes.reduce((a, b) => a + b, 0) / extractedSizes.length;
    const summary = `Min: ${minSize}, Max: ${maxSize}, Avg: ${avgSize.toFixed(2)}, Count: ${extractedSizes.length}`;
    setDataSummary(summary);

    console.log('Data distribution:', extractedSizes.reduce((acc, size) => {
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {} as {[key: number]: number}));
  }, []);

  const minSize = Math.min(...fileSizes);
  const maxSize = Math.max(...fileSizes);
  const binCount = 30;
  const binSize = (maxSize - minSize + 1) / binCount;

  return (
    <div className="App">
      <header className="App-header">
        <p>{dataSummary}</p>
        <Plot
          data={[
            {
              x: fileSizes,
              type: 'histogram',
              marker: {color: 'rgba(75, 192, 192, 0.7)'},
              xbins: {
                start: minSize,
                end: maxSize + binSize,  // 최대값을 포함하기 위해 binSize를 더함
                size: binSize
              },
              autobinx: false,
            },
          ]}
          layout={{
            width: 1000,
            height: 600,
            title: '',
            xaxis: {
              title: 'File Size',
              range: [minSize, maxSize + binSize],  // x축 범위도 조정
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
