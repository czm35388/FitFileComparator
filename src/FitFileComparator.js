import React, { useState, useRef } from 'react';
import FitFileParser from 'fit-file-parser';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register necessary components and the zoom and annotation plugins
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin);

const FitFileComparator = () => {
  const [fileData, setFileData] = useState(null);
  const [showPower, setShowPower] = useState(true);
  const [showHeartRate, setShowHeartRate] = useState(true);
  
  const chartRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fitParser = new FitFileParser();
        fitParser.parse(e.target.result, (error, data) => {
          if (error) {
            console.error('Error parsing FIT file:', error);
          } else {
            setFileData(data);
          }
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const getChartData = (data) => {
    const startTime = new Date(data.records[0].timestamp);
    const elapsedTime = data.records.map(record => {
      const currentTime = new Date(record.timestamp);
      const diffInSeconds = Math.floor((currentTime - startTime) / 1000);
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    });

    const power = data.records.map(record => record.power || 0);
    const heartRate = data.records.map(record => record.heart_rate || 0);

    const datasets = [];
    if (showPower) {
      datasets.push({
        label: 'Power',
        data: power,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        type: 'bar',
      });
    }
    if (showHeartRate) {
      datasets.push({
        label: 'Heart Rate',
        data: heartRate,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        type: 'line',
      });
    }

    return {
      labels: elapsedTime,
      datasets: datasets,
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      zoom: {
        zoom: {
          enabled: true,
          mode: 'x',
          drag: true,
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
      },
      annotation: {
        annotations: {
          box: {
            type: 'box',
            xMin: selectionStart,
            xMax: selectionEnd,
            yMin: null,
            yMax: null,
            backgroundColor: 'rgba(255, 255, 0, 0.5)',
            borderColor: 'rgba(255, 255, 0, 1)',
            borderWidth: 1,
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Elapsed Time (HH:MM:SS)',
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Values',
        },
      },
    },
  };

  const resetZoom = (chart) => {
    if (chart) {
      chart.resetZoom();
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const handleChartMouseDown = (event) => {
    const chart = chartRef.current;
    const { x } = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
    if (x.length) {
      setSelectionStart(x[0].index);
      setIsSelecting(true);
    }
  };

  const handleChartMouseUp = (event) => {
    const chart = chartRef.current;
    const { x } = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
    if (isSelecting && x.length) {
      setSelectionEnd(x[0].index);
      setIsSelecting(false);
      chart.update();
    }
  };

  return (
    <div>
      <h1>FIT File Comparator</h1>
      <div>
        <h2>Upload FIT File</h2>
        <input type="file" accept=".fit" onChange={handleFileChange} />
      </div>
      <div>
        <h2>Select Data to Display</h2>
        <label>
          <input type="checkbox" checked={showPower} onChange={() => setShowPower(!showPower)} />
          Show Power
        </label>
        <label>
          <input type="checkbox" checked={showHeartRate} onChange={() => setShowHeartRate(!showHeartRate)} />
          Show Heart Rate
        </label>
      </div>
      {fileData && (
        <div>
          <h2>File Data</h2>
          <Bar 
            ref={chartRef} // Attach the ref to the chart
            data={getChartData(fileData)} 
            options={{
              ...options,
              onMouseDown: handleChartMouseDown, // Handle mouse down to start selection
              onMouseUp: handleChartMouseUp, // Handle mouse up to end selection
            }} 
          />
          <button onClick={() => resetZoom(chartRef.current)}>Reset Zoom</button>
        </div>
      )}
    </div>
  );
};

export default FitFileComparator;
