import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import trainMetadata from './data/train_metadata.json';
import scatterData from './data/scatter_data.json';

// Plotly의 Datum 타입을 import합니다. 
// 만약 이 import가 작동하지 않는다면, any를 사용할 수 있습니다.
import { Datum } from 'plotly.js';

interface Metadata {
  [key: string]: number | string | Date | boolean;
}

interface ScatterMetadata {
  [key: string]: number[];
}

type BinningType = 'enum' | 'range';
type RangeType = 'auto' | 'manual';

interface ScatterDataPoint {
  x: number | string | boolean;
  y: number;
}

function App() {
  const [metadata, setMetadata] = useState<Metadata>({});
  const [scatterMetadata, setScatterMetadata] = useState<ScatterMetadata>({});
  const [dataType, setDataType] = useState<'int' | 'string' | 'date' | 'bool' | 'float'>('int');
  const [binningType, setBinningType] = useState<BinningType>('range');
  const [rangeType, setRangeType] = useState<RangeType>('auto');
  const [manualBinCount, setManualBinCount] = useState<number>(20);
  const [barData, setBarData] = useState<{x: (number | string)[], y: number[]}>({x: [], y: []});
  const [scatterPlotData, setScatterPlotData] = useState<{
    x: Datum[],
    y: number[],
    colors: string[]
  }>({x: [], y: [], colors: []});
  const [colors, setColors] = useState<string[]>([]);
  const [hoverTexts, setHoverTexts] = useState<string[]>([]);
  const [plotRange, setPlotRange] = useState<[number, number]>([0, 0]);
  const [dataSummary, setDataSummary] = useState<string>('');
  const [valueToColorMap, setValueToColorMap] = useState<Map<string | number, string>>(new Map());
  const [avgCount, setAvgCount] = useState<number | null>(null);

  useEffect(() => {
    setMetadata(trainMetadata.metadata as Metadata);
    setScatterMetadata(scatterData.metadata as ScatterMetadata);
  }, []);

  const generateHistogram = () => {
    if (binningType === 'enum') {
      const avgCount = generateEnumHistogram();
      setAvgCount(avgCount);
    } else {
      const avgCount = generateRangeHistogram();
      setAvgCount(avgCount);
    }
  };

  const generateEnumHistogram = () => {
    const counts: { [key: string]: number } = {};
    Object.values(metadata).forEach(value => {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    });

    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const x = sortedCounts.map(([key]) => key);
    const y = sortedCounts.map(([, count]) => count);

    setBarData({ x, y });
    const newColors = generateColors(x.length);
    setColors(newColors);
    generateHoverTexts(x, y);

    const minValue = x[x.length - 1];  // 가장 적게 등장하는 값
    const maxValue = x[0];  // 가장 많이 등장하는 값
    const totalCount = y.reduce((a, b) => a + b, 0);
    const binCount = x.length;
    const avgCount = totalCount / binCount;  // y축 count의 평균
    const sumOfBinCounts = y.reduce((a, b) => a + b, 0);  // 각 bin의 count 합

    setDataSummary(`Min: ${minValue}, Max: ${maxValue}, Avg Count: ${avgCount.toFixed(2)}, Count: ${totalCount}, Bin Count: ${binCount}, Sum of Bin Counts: ${sumOfBinCounts}`);

    const newValueToColorMap = new Map<string | number, string>();
    x.forEach((value, index) => {
      newValueToColorMap.set(value, newColors[index]);
    });
    setValueToColorMap(newValueToColorMap);

    generateScatterPlotData(newValueToColorMap);

    return avgCount; // 평균 count 값을 반환
  };

  const generateRangeHistogram = () => {
    const values = Object.values(metadata).map(Number);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    let binCount = manualBinCount;
    if (rangeType === 'auto') {
      binCount = Math.ceil(Math.log2(values.length) + 1);
    }

    const binSize = (maxValue - minValue) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => minValue + i * binSize);
    const counts = new Array(binCount).fill(0);

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minValue) / binSize), binCount - 1);
      counts[binIndex]++;
    });

    setBarData({ x: bins, y: counts });
    setPlotRange([minValue, maxValue + binSize]);
    const newColors = generateColors(binCount);
    setColors(newColors);
    generateHoverTexts(bins, counts);

    const totalCount = counts.reduce((a, b) => a + b, 0);
    const avgCount = totalCount / binCount;  // y축 count의 평균
    const sumOfBinCounts = counts.reduce((a, b) => a + b, 0);  // 각 bin의 count 합

    setDataSummary(`Min: ${minValue.toFixed(2)}, Max: ${maxValue.toFixed(2)}, Avg Count: ${avgCount.toFixed(2)}, Count: ${values.length}, Bin Count: ${binCount}, Sum of Bin Counts: ${sumOfBinCounts}`);

    const newValueToColorMap = new Map<string | number, string>();
    bins.forEach((binStart, index) => {
      newValueToColorMap.set(binStart, newColors[index]);
    });
    setValueToColorMap(newValueToColorMap);

    generateScatterPlotData(newValueToColorMap);

    return avgCount; // 평균 count 값을 반환
  };

  const generateColors = (count: number) => {
    return Array.from({length: count}, (_, i) => 
      `hsl(${(i * 360 / count) % 360}, 70%, 50%)`
    );
  };

  const generateHoverTexts = (x: (number | string)[], y: number[]) => {
    const newHoverTexts = x.map((value, i) => {
      if (typeof value === 'number') {
        const nextValue = i < x.length - 1 ? x[i + 1] : (value as number + 1);
        return `[${value.toFixed(2)}, ${(nextValue as number).toFixed(2)}) <br>Count: ${y[i]}`;
      }
      return `${value} <br>Count: ${y[i]}`;
    });
    setHoverTexts(newHoverTexts);
  };

  const generateScatterPlotData = (colorMap: Map<string | number, string>) => {
    const scatterData: ScatterDataPoint[] = [];
    const scatterColors: string[] = [];

    for (const [key, value] of Object.entries(scatterMetadata)) {
      const x: number | string | boolean = value[0];  // x 좌표
      const y: number = value[1];  // y 좌표
      scatterData.push({ x, y });

      let color: string;
      if (binningType === 'enum') {
        // For enum, find an exact match or the first occurrence in colorMap
        const xString = String(x);
        const matchingKey = Array.from(colorMap.keys()).find(key => String(key) === xString) 
                            || Array.from(colorMap.keys())[0];
        color = colorMap.get(matchingKey) || 'gray';
      } else {
        // For range, find the appropriate bin
        if (typeof x === 'number') {
          const binStart = Array.from(colorMap.keys()).reduce((prev, curr) => 
            (Number(curr) <= x && Number(curr) > Number(prev)) ? curr : prev
          );
          color = colorMap.get(binStart) || 'gray';
        } else if (typeof x === 'string' && !isNaN(Date.parse(x))) {
          // Treat x as a date string
          const xTime = new Date(x).getTime();
          const binStart = Array.from(colorMap.keys()).reduce((prev, curr) => {
            const prevTime = typeof prev === 'string' ? new Date(prev).getTime() : Number(prev);
            const currTime = typeof curr === 'string' ? new Date(curr).getTime() : Number(curr);
            return (currTime <= xTime && currTime > prevTime) ? curr : prev;
          });
          color = colorMap.get(binStart) || 'gray';
        } else {
          // For non-numeric and non-date types in range mode, use a default color
          color = 'gray';
        }
      }
      scatterColors.push(color);
    }

    setScatterPlotData({
      x: scatterData.map(d => d.x as Datum),  // x를 Datum으로 타입 단언
      y: scatterData.map(d => d.y),
      colors: scatterColors
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={(e) => { e.preventDefault(); generateHistogram(); }}>
          <select value={dataType} onChange={(e) => setDataType(e.target.value as any)}>
            <option value="int">Integer</option>
            <option value="string">String</option>
            <option value="date">Date</option>
            <option value="bool">Boolean</option>
            <option value="float">Float</option>
          </select>
          <select value={binningType} onChange={(e) => setBinningType(e.target.value as BinningType)}>
            <option value="enum">Enum</option>
            <option value="range">Range</option>
          </select>
          {binningType === 'range' && (
            <>
              <select value={rangeType} onChange={(e) => setRangeType(e.target.value as RangeType)}>
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
              {rangeType === 'manual' && (
                <input
                  type="number"
                  value={manualBinCount}
                  onChange={(e) => setManualBinCount(Number(e.target.value))}
                  min="1"
                />
              )}
            </>
          )}
          <button type="submit">Generate Histogram</button>
        </form>
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
            }
          ]}
          layout={{
            width: 1000,
            height: 600,
            title: 'Histogram',
            xaxis: {
              title: 'Value',
              range: plotRange,
            },
            yaxis: {title: 'Frequency'},
            bargap: 0.1,
            shapes: avgCount !== null ? [
              {
                type: 'line',
                x0: Math.min(...barData.x as number[]), // x축의 시작
                x1: Math.max(...barData.x as number[]), // x축의 끝
                y0: avgCount, // 평균 count
                y1: avgCount,
                line: {
                  color: 'red',
                  width: 2,
                  dash: 'dash', // 대시 선
                },
              },
            ] : [],
          }}
        />
        <Plot
          data={[
            {
              x: scatterPlotData.x,
              y: scatterPlotData.y,
              type: 'scattergl',
              mode: 'markers',
              marker: {
                color: scatterPlotData.colors,
                size: 5,
                opacity: 0.7,
              },
            }
          ]}
          layout={{
            width: 1000,
            height: 600,
            title: 'Scatter Plot',
            xaxis: {title: 'X'},
            yaxis: {title: 'Y'},
          }}
        />
      </header>
    </div>
  );
}

export default App;
