// La Société Nouvelle

// React
import React from "react";
import Chart from "chart.js/auto";
import { Bar } from "react-chartjs-2";
import pattern from 'patternomaly';

// Colors
import { lighten } from "polished";

// Libraries
import metaIndics from "/lib/indics";

// Utils
import { printValue } from "/src/utils/formatters";
import { getLabelPeriod, getYearPeriod } from "../../../../utils/periodsUtils";

// Styles
import { colors, comparativeChartColors, tooltips } from "../../../../constants/chartColors";
import { getLatestYear } from "../utils";

/* ---------- VERTICAL BAR CHART ---------- */

/** Bar chart to compare footprint with macro & branch
 * 
 *  datasetOptions :
 *    - period
 *    - aggregate
 *    - indic
 * 
 *  printOptions :
 *    - printMode -> use in report
 *    - showAreaData
 *    - showDivisionData
 *    - showTargetData
 *    - useIndicColors
 *    - label
 * 
 */

export const VerticalBarChart = ({
  id,
  session,
  datasetOptions,
  printOptions
}) => {


  // --------------------------------------------------
  // Data

  const chartData = buildChartData(session, datasetOptions, printOptions);

  // --------------------------------------------------
  // Options

  const yearsLabelsTooltips = getYearsLabelsTooltips(session, datasetOptions);

  const chartOptions = buildChartOptions(
    datasetOptions,
    printOptions,
    yearsLabelsTooltips
  );

  // --------------------------------------------------

  return (
    <Bar
      id={id}
      data={chartData}
      options={chartOptions}
    />
  );
};

// ################################################## DATASET ##################################################

const buildChartData = (session, datasetOptions, printOptions) => {
  const { financialData, comparativeData } = session;
  const mainAggregates = financialData.mainAggregates;
  const { indic, aggregate, period } = datasetOptions;
  const { showAreaData, showDivisionData, showTargetData, useIndicColors } = printOptions;

  const labels = [];
  const data = [];
  const backgroundColors = [];

  // Area data
  if (showAreaData) {
    const areaValue = comparativeData[aggregate].area.history.data[indic].slice(-1)[0]?.value;
    const areaTargetValue = comparativeData[aggregate].area.target.data[indic].slice(-1)[0]?.value;

    if (areaValue !== undefined) {
      labels.push('France');
      data.push(areaValue);
      backgroundColors.push(comparativeChartColors.area);
    }

    if (showTargetData && areaTargetValue !== undefined) {
      labels.push('Objectif ');
      data.push(areaTargetValue);
      backgroundColors.push(pattern.draw('diagonal', "#ffffff", comparativeChartColors.area, 10));
    }

  }

  // Legal unit data
  const legalUnitValue = mainAggregates[aggregate].periodsData[period.periodKey].footprint.indicators[indic]?.value;
  if (legalUnitValue !== undefined) {

    const labelPeriod = getLabelPeriod(period);

    const [label, ...rest] = labelPeriod.split(' ');

    labels.push([label, rest.join(' ')]);

    data.push(legalUnitValue);
    backgroundColors.push(useIndicColors ? metaIndics[indic].color : comparativeChartColors.legalunit);


  }

  // Division data
  if (showDivisionData) {
    const divisionValue = comparativeData[aggregate].division.history.data[indic].slice(-1)[0]?.value;

    if (divisionValue !== undefined) {
      labels.push('Branche');
      data.push(divisionValue);
      backgroundColors.push(useIndicColors ? lighten('0.3', metaIndics[indic].color) : comparativeChartColors.branch);
    }


  }

  const divisionTargetValue = comparativeData[aggregate].division.target.data[indic].filter(value => value.path === "GEO").slice(-1)[0]?.value ?? null;

  if (showTargetData && divisionTargetValue !== undefined) {


    labels.push("Objectif");
    data.push(divisionTargetValue);
    backgroundColors.push(useIndicColors ? pattern.draw('diagonal', "#ffffff", lighten('0.3', metaIndics[indic].color), 10) : pattern.draw('diagonal', "#ffffff", comparativeChartColors.branch, 10));
  }
  // Build the chart data
  const datasets = [{
    label: 'Empreinte',
    data,
    backgroundColor: backgroundColors,
    borderWidth: 0,
    barPercentage: 0.8,
    categoryPercentage: 0.8,
    minBarLength: 2,
    skipNull: true,
  }];

  return { labels, datasets };
};


// const buildChartData = (session,datasetOptions,printOptions) => 
// {
//   const { 
//     financialData, 
//     comparativeData 
//   } = session;
//   const mainAggregates = financialData.mainAggregates;
//   const {
//     indic,
//     aggregate,
//     period
//   } = datasetOptions;
//   const {
//     showAreaData,
//     showDivisionData,
//     showTargetData,
//     useIndicColors,
//   } = printOptions;

//   const datasets = [];
//   const labels = buildLabels(
//     showAreaData,
//     showDivisionData,
//     period
//   );
//   const hasTargetData = comparativeData[aggregate].division.target.data[indic].length > 0 ? true : false;
//   // ------------ --------------------------------------
//   // footprint dataset

//   const footprintDataset = {
//     label: "Empreinte",
//     data: buildFootprintData(
//       comparativeData,
//       aggregate,
//       indic,
//       showAreaData,
//       showDivisionData,
//       mainAggregates,
//       period,
//     ),
//     backgroundColor: buildFootprintBackgroundColors(
//       indic,
//       useIndicColors,
//       showAreaData,
//       showDivisionData,
//     ),
//     borderWidth: 0,
//     type: "bar",
//     barPercentage: 0.6,
//     categoryPercentage: 0.9,
//     minBarLength: 2,
//   };

//   datasets.push(footprintDataset);

//   // --------------------------------------------------
//   // target dataset
//   if (showTargetData && hasTargetData )
//   {
//     const targetDataset = {
//       label: "Objectif",
//       data: buildTargetData(
//         comparativeData,
//         aggregate,
//         indic,
//         showAreaData,
//         showDivisionData
//       ),
//       skipNull: true,
//       backgroundColor: buildTargetBackgroundPatterns(
//         showAreaData,
//         showDivisionData
//       ),
//       borderWidth: 0,
//       barPercentage: 0.5,
//       categoryPercentage: 0.9,
//       minBarLength: 2,
//     }

//     datasets.push(targetDataset);
//   }

//   // --------------------------------------------------

//   const chartData = {
//     datasets,
//     labels,
//   };
//   return chartData;
// }

const buildFootprintData = (
  comparativeData,
  aggregate,
  indic,
  showAreaData,
  showDivisionData,
  mainAggregates,
  period,
) => {

  const data = [];

  // Footprint area
  if (showAreaData) {
    let areaValue = comparativeData[aggregate].area.history.data[indic].slice(-1)[0]?.value;
    data.push(areaValue);
  }

  // Footprint legal unit
  let legalUnitValue = mainAggregates[aggregate].periodsData[period.periodKey].footprint.indicators[indic]?.value;
  data.push(legalUnitValue);

  // Footprint division
  if (showDivisionData) {
    let divisionValue = comparativeData[aggregate].division.history.data[indic].slice(-1)[0].value;
    data.push(divisionValue);
  }

  return data;
}

const buildFootprintBackgroundColors = (
  indic,
  useIndicColors,
  showAreaData,
  showDivisionData,
) => {

  const { color: indicColor } = metaIndics[indic];

  const backgroundColors = [];

  // Footprint area
  if (showAreaData) {
    backgroundColors.push(comparativeChartColors.area);
  }

  // Footprint legal unit
  let legalUnitBackgroundColor = useIndicColors ? indicColor : comparativeChartColors.legalunit;
  backgroundColors.push(legalUnitBackgroundColor);

  // Footprint division
  if (showDivisionData) {
    let divisionBackgroundColor = useIndicColors ? lighten('0.3', indicColor) : comparativeChartColors.branch;
    backgroundColors.push(divisionBackgroundColor);
  }

  return backgroundColors;
}

const buildTargetData = (
  comparativeData,
  aggregate,
  indic,
  showAreaData,
  showDivisionData
) => {

  const data = [];

  // Target area
  if (showAreaData) {
    let areaTargetValue = comparativeData[aggregate].area.target.data[indic].slice(-1)[0]?.value;
    data.push(areaTargetValue);
  }

  // Target legal unit
  data.push(null);

  // Target division
  if (showDivisionData) {
    let divisionTargetValue = comparativeData[aggregate].division.target.data[indic].slice(-1)[0]?.value;
    data.push(divisionTargetValue);
  }

  return data;
}


const buildTargetBackgroundPatterns = (
  showAreaData,
  showDivisionData
) => {
  const backgroundPatterns = [];

  // Target area
  if (showAreaData) {
    backgroundPatterns.push(pattern.draw('diagonal', comparativeChartColors.targetarea), "#ffffff", 10);
  }

  // Target legal unit
  backgroundPatterns.push(colors.transparent);

  // Target division
  if (showDivisionData) {
    backgroundPatterns.push(pattern.draw('diagonal', comparativeChartColors.targetbranch), "#ffffff", 10);
  }

  return backgroundPatterns;
}

const buildLabels = (
  showAreaData,
  showDivisionData,
  period
) => {

  const labels = [];

  if (showAreaData) {
    labels.push("France");
  }

  labels.push(getLabelPeriod(period));

  if (showDivisionData) {
    labels.push("Branche");
  }
  return labels;
}

const getYearsLabelsTooltips = (session, datasetOptions) => {
  const { period, aggregate, indic } = datasetOptions;

  const branchData = session.comparativeData[aggregate].division.history.data[indic] ?? [];
  const targetData = session.comparativeData[aggregate].division.target.data[indic] ?? [];
  const areaData = session.comparativeData[aggregate].area.history.data[indic] ?? [];
  const areaTargetData = session.comparativeData[aggregate].area.target.data[indic] ?? [];

  const branchValueYear = getLatestYear(branchData);
  const targetValueYear = getLatestYear(targetData);
  const areaValueYear = getLatestYear(areaData);
  const areaTargetValueYear = getLatestYear(areaTargetData);
  const legalUnitYear = getYearPeriod(period)
  return {
    branchValueYear,
    targetValueYear,
    areaValueYear,
    areaTargetValueYear,
    legalUnitYear
  };
}


// ################################################## OPTIONS ##################################################

const buildChartOptions = (
  datasetOptions,
  printOptions,
  yearsLabelsTooltips
) => {

  const {
    branchValueYear,
    targetValueYear,
    areaValueYear,
    areaTargetValueYear,
    legalUnitYear
  } = yearsLabelsTooltips;

  const {
    indic,
    period,
  } = datasetOptions;
  const {
    printMode,
    showLegend,
    showXlabels,
    aspectRatio,
    maxYAxis
  } = printOptions;
  const {
    unit,
    nbDecimals
  } = metaIndics[indic];


  // Custom Title 

  const chartOptions = {
    aspectRatio: aspectRatio,
    devicePixelRatio: 2,
    layout: {
      padding: {
        top: printMode ? 0 : 40
      },
    },
    scales: {
      y: {
        display: true,
        min: 0,
        suggestedMax: maxYAxis,
        ticks: {
          color: colors.textColor,
          font: {
            size: printMode ? 14 : 10,
          },
        },
        grid: {
          color: colors.gridColor,
          lineWidth: printMode ? 0 : 1,
        },
      },
      x: {
        display: showXlabels,
        ticks: {
          color: colors.textColor,
          align: "center",
          font: {
            size: printMode ? 18 : 10,
          },
        },
        grid: {
          lineWidth: 1,
          color: colors.gridColor,
        },
      },
    },
    plugins: {
      legend: {
        display: showLegend,
        position: "bottom",
        align: "center",
        fullSize: true,
        labels: {
          boxWidth: 10,
          color: colors.textColor,
          font: {
            size: printMode ? 15 : 10,
            family: "Roboto",
            weight: printMode ? "bold" : "normal",
          },
          generateLabels: (chart) => {
            const labels = [];
            chart.data.labels.forEach((label, labelIndex) => {
              chart.data.datasets.forEach((dataset, datasetIndex) => {
                const backgroundColor = dataset.backgroundColor[labelIndex];
                if (backgroundColor) {
                  labels.push({
                    text: Array.isArray(label) ? label.join(' ') : label,
                    textAlign: 'left',
                    fillStyle: backgroundColor,
                    strokeStyle: backgroundColor,
                    lineWidth: 0,
                    hidden: false,
                    boxWidth: printMode ? 15 : 10,
                    boxHeight: printMode ? 15 : 10,
                  });
                }
              });
            });
            return labels;
          },
          // sort: (a,b) => {
          //   return -a.text.localeCompare(b.text);
          // }
        },
      },
      datalabels: {
        display: printMode ? false : true,
        overlap: "auto",
        anchor: "end",
        align: "top",
        textAlign: "center",
        formatter: function (value) {
          if (value || value === 0) {
            if (Number.isInteger(value)) {
              return `${printValue(value, 0)}\n${unit}`;
            }
            return `${printValue(value, nbDecimals)}\n${unit}`;
          }
        },
        color: colors.textColor,
        font: {
          size: printMode ? 14 : 10,
          weight: printMode ? "bold" : "normal",
          family: "Roboto",
        },
        padding: {
          bottom: 3,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: printMode ? false : true,
        backgroundColor: tooltips.backgroundColor,
        padding: tooltips.padding,
        cornerRadius: tooltips.cornerRadius,
        filter: function (tooltipItem) {
          // Hide tooltip for null value
          return tooltipItem.raw;
        },
        callbacks: {
          label: function (context) {
            const datasetLabel = context?.dataset.label;
            const rawValue = printValue(context?.raw, nbDecimals);
            const unitLabel = `${unit}`;
            // Area dataset
            if (context.dataIndex === 0) {
              return `${datasetLabel} (${context.datasetIndex === 0 ? areaValueYear : areaTargetValueYear
                }) : ${rawValue}${unitLabel}`;
            }

            // Legal Unit dataset
            if (context.dataIndex === 1) {
              return `${datasetLabel} (${legalUnitYear}): ${rawValue}${unitLabel}`;
            }

            // Target dataset
            if (context.dataIndex === 2) {
              return `${datasetLabel} (${context.datasetIndex === 0 ? branchValueYear : targetValueYear
                }) : ${rawValue}${unitLabel}`;
            }
          },

          title: (context) => {
            const periodLabel = getLabelPeriod(period);
            const customTitle =
              context[0]?.label == periodLabel
                ? "Unité Légale"
                : context[0]?.label;

            return customTitle;
          },
        },
      },
    },
  };

  return chartOptions;
}