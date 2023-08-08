// La Société Nouvelle

import { printValue } from "../../utils/Utils";

export const analysisTextWriterNRG = (props) => {
  const { impactsData, financialData, period } = props;
  const { mainAggregates, productionAggregates } = financialData;
  const { revenue} = productionAggregates;

  // array of paragraphs
  let analysis = [];
  let currentParagraph = [];

  // Intro ----------------------------------------------------------------------------------------- //

  currentParagraph = [];

  currentParagraph.push(
    "L'indicateur exprime la quantité d'énergie consommée pour produire un euro de l'agrégat considéré."
  );

  // Production ------------------------------------------------------------------------------------ //

  currentParagraph = [];

  currentParagraph.push(
    "L'intensité énergétique de la valeur produite est de " +
      printValue(mainAggregates.production.periodsData[period.periodKey].footprint.indicators.nrg.value, 0) +
      " kJ/€."
  );
  if (
    mainAggregates.production.periodsData[period.periodKey].footprint.indicators.nrg.value !=
    revenue.periodsData[period.periodKey].footprint.indicators.nrg.value
  ) {
    currentParagraph.push(
      "La valeur est de " +
        printValue(revenue.periodsData[period.periodKey].footprint.indicators.nrg.value, 0) +
        " kJ/€ pour le chiffre d'affaires, en prenant compte des stocks de production."
    );
  } else {
    currentParagraph.push(
      "La valeur est identique pour le chiffre d'affaires."
    );
  }

  analysis.push(currentParagraph);

  // Impact direct --------------------------------------------------------------------------------- //

  currentParagraph = [];

  if (!impactsData.energyConsumption) {
    currentParagraph.push(
      "Aucune consommation directe d'énergie n'est déclarée."
    );
  } else {
    currentParagraph.push(
      "La consommation directe d'énergie est de " +
        printValue(impactsData.energyConsumption, 0) +
        " MJ," +
        " soit une intensité de " +
        printValue(mainAggregates.netValueAdded.periodsData[period.periodKey].footprint.indicators.nrg.value, 0) +
        " kJ/€ pour la valeur ajoutée."
    );
    currentParagraph.push(
      "La consommation directe d'énergie représente " +
        printValue(
          (impactsData.energyConsumption /
            mainAggregates.production.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
              mainAggregates.production.periodsData[period.periodKey].amount
            )) *
            100,
          0
        ) +
        " % de la consommation totale d'énergie liée à la production."
    );
  }

  analysis.push(currentParagraph);

  // Consommations intermédiaires ------------------------------------------------------------------ //

  currentParagraph = [];

  // résultat
  currentParagraph.push(
    "Les consommations intermédiaires sont à l'orgine d'une consommation indirecte de " +
      printValue(
        mainAggregates.intermediateConsumptions.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
          mainAggregates.intermediateConsumptions.periodsData[period.periodKey].amount
        ),
        0
      ) +
      " MJ," +
      " ce qui correspond à une intensité de " +
      printValue(
        mainAggregates.intermediateConsumptions.periodsData[period.periodKey].footprint.indicators.nrg.value,
        0
      ) +
      " kJ/€."
  );
  currentParagraph.push(
    "La consommation indirecte d'énergie des consommations intermédiaires représente " +
      printValue(
        (mainAggregates.intermediateConsumptions.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
          mainAggregates.intermediateConsumptions.periodsData[period.periodKey].amount
        ) /
          mainAggregates.production.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
            mainAggregates.production.periodsData[period.periodKey].amount
          )) *
          100,
        0
      ) +
      " % de la consommation totale liée à la production."
  );

  analysis.push(currentParagraph);

  // comparaison branche

  // comptes les plus impactants

  // Investissements ------------------------------------------------------------------------------- //

  currentParagraph = [];

  currentParagraph.push(
    "L'amortissement des immobilisations représente une consommation indirecte de " +
      printValue(
        mainAggregates.fixedCapitalConsumptions.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
          mainAggregates.fixedCapitalConsumptions.periodsData[period.periodKey].amount
        ),
        0
      ) +
      " MJ," +
      " soit " +
      printValue(
        (mainAggregates.fixedCapitalConsumptions.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
          mainAggregates.fixedCapitalConsumptions.periodsData[period.periodKey].amount
        ) /
          mainAggregates.production.periodsData[period.periodKey].footprint.indicators.nrg.getGrossImpact(
            mainAggregates.production.periodsData[period.periodKey].amount
          )) *
          100,
        0
      ) +
      " % de la consommation totale liée à la production."
  );

  analysis.push(currentParagraph);

  return analysis;
};
