import React from "react";
// Modules
import Chart from "chart.js/auto";

import { Radar } from "react-chartjs-2";

function RadarChart({ labels, divisionFootprint, productionFootprint }) {

  const data = {
    labels: Object.values(labels).map((indicator) => {
        const label = indicator.libelleGrandeur;
        const unit = indicator.unit;
        return unit ? `${label} (${unit})` : label;
      }),
          datasets: [
      {
        label: "Exercice",
        data: Object.values(productionFootprint),
        fill: false,
        pointBackgroundColor: "rgb(250,89,95)",
        pointBorderColor: "rgb(250,89,95)",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(255, 99, 132)",
      },
      {
        label: "Branche",
        data: Object.values(divisionFootprint),
        fill: false,
        pointBackgroundColor: "rgb(255, 182, 66)",
        pointBorderColor: "rgb(255, 182, 66)",
        pointHoverBackgroundColor: "rgb(255, 182, 66)",
        pointHoverBorderColor: "rgb(255, 99, 132)",
      },
    ],
  };

  const datasetBorderColor = (context) => {
    const datasetIndex = context.datasetIndex;
  
    const colors = [
      "rgba(250,89,95,0.5)", 
      "rgba(255, 182, 66, 0.5)", 
    ];
  
    return colors[datasetIndex];
  };

  const datasetRadius = (context) => {
    const datasetIndex = context.datasetIndex;
  
    const radius = [4,2
    ];
  
    return radius[datasetIndex];
  };


  const options = {
    devicePixelRatio: 2,
    responsive: true,

    scales: {
      r: {

        grid: {
          color: "rgb(219, 222, 241)",
        },
        ticks: {
          display: false,
        },
        pointLabels: {
          display: true,
          font: {
            family: "Raleway",
            size: 10,
            weight: "600",
          },
          color: "#191558",
        },
      },
    },

    elements: {
      point: {
        radius: datasetRadius, 
        hoverRadius: 3,
      },
      line: {
        borderWidth: 2, 
        borderColor: datasetBorderColor,
      },
    },
    plugins: {
      datalabels: {
        display: false,
      },
      legend: {
        display: true,
        position: "bottom",
        padding: 0, 
        labels: {
          color: "#191558",
          font: {
            size: 12,
            weight: "600",
            family: "Raleway",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(25,21,88,0.9)",
        padding: 15,
        cornerRadius: 3,
        usePointStyle: true,
        intersect: false,

      },
    },
  };

  return <Radar data={data} options={options} />;
}

export default RadarChart;
