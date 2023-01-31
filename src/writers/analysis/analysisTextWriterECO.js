// La Société Nouvelle
import { printValue } from "../../utils/Utils";

export const analysisTextWriterECO = (session) => {
  const { impactsData, comparativeData, financialData } = session;
  const { aggregates, expenseAccounts } = financialData;

  // array of paragraphs
  let analysis = [];
  let currentParagraph = [];

  // Intro ----------------------------------------------------------------------------------------- //

  currentParagraph = [];

  currentParagraph.push(
    "L'indicateur renseigne sur la part de la valeur produite en France."
  );

  // Impact direct --------------------------------------------------------------------------------- //

  currentParagraph = [];

  if (impactsData.isAllActivitiesInFrance) {
    currentParagraph.push(
      "Les activités de l'entreprise sont localisées en France et contribuent, de ce fait, entièrement à l'économie nationale."
    );
  } else if (!impactsData.isAllActivitiesInFrance) {
    currentParagraph.push(
      "Les activités de l'entreprise sont localisées hors de France."
    );
  } else {
    currentParagraph.push(
      "Le volume des activités localisées en France s'élève à " +
        impactsData.domesticProduction +
        "€, soit " +
        aggregates.netValueAdded.footprint.indicators.eco.value +
        "% de la valeur ajoutée."
    );
  }

  analysis.push(currentParagraph);

  // Consommations intermédiaires ------------------------------------------------------------------ //

  currentParagraph = [];

  // résultat
  currentParagraph.push(
    "Les consommations intermédiaires proviennent à " +
      aggregates.intermediateConsumption.footprint.indicators.eco.value +
      "% d'activités françaises, soit un volume de " +
      printValue(
        aggregates.intermediateConsumption.footprint.indicators.eco.getGrossImpact(
          aggregates.intermediateConsumption.amount
        ),
        0
      ) +
      " €."
  );

  analysis.push(currentParagraph);

  // comparaison branche

  if (
    comparativeData.intermediateConsumption.divisionFootprint.indicators.eco
      .value != null
  ) {
    if (
      aggregates.intermediateConsumption.footprint.indicators.eco.value >
        comparativeData.intermediateConsumption.divisionFootprint.indicators.eco
          .value *
          0.9 &&
      aggregates.intermediateConsumption.footprint.indicators.eco.value <
        comparativeData.intermediateConsumption.divisionFootprint.indicators.eco
          .value *
          1.1
    ) {
      currentParagraph.push(
        "Le taux de contribution se situe à un niveau similaire à la branche d'activités."
      );
    }
    if (
      aggregates.intermediateConsumption.footprint.indicators.eco.value >
      comparativeData.intermediateConsumption.divisionFootprint.indicators.eco
        .value
    ) {
      currentParagraph.push(
        "Le taux de contribution se situe à un niveau supérieur à la branche d'activités."
      );
    } else {
      currentParagraph.push(
        "Le taux de contribution se situe à un niveau inférieur à la branche d'activités."
      );
    }
  }

  // comptes les plus impactants
  let bestAccount = expenseAccounts.sort(
    (a, b) =>
      b.footprint.indicators.eco.getGrossImpact(b.amount) -
      a.footprint.indicators.eco.getGrossImpact(a.amount)
  )[0];
  currentParagraph.push(
    'Le compte de charges "' +
      bestAccount.accountLib.charAt(0) +
      bestAccount.accountLib.substring(1).toLowerCase() +
      "\" représente la plus grosse contribution indirecte de l'entreprise, avec un taux de contribution de " +
      bestAccount.footprint.indicators.eco.value +
      " % pour un volume de " +
      printValue(bestAccount.amount, 0) +
      " €."
  );

  // Investissements ------------------------------------------------------------------------------- //

  currentParagraph = [];

  currentParagraph.push(
    "L'amortissement des immobilisations apporte une contribution indirecte de " +
      printValue(
        aggregates.capitalConsumption.footprint.indicators.eco.getGrossImpact(
          aggregates.capitalConsumption.amount
        ),
        0
      ) +
      " €, " +
      aggregates.capitalConsumption.footprint.indicators.eco.value +
      " % du montant des dotations aux amortissements."
  );

  analysis.push(currentParagraph);

  // Production ------------------------------------------------------------------------------------ //

  currentParagraph = [];

  currentParagraph.push(
    "In fine, le taux de contribution de la production sur l'exercice est de " +
      aggregates.production.footprint.indicators.eco.value +
      " %."
  );
  if (
    aggregates.production.footprint.indicators.eco.value !=
    aggregates.revenue.footprint.indicators.eco.value
  ) {
    currentParagraph.push(
      "La valeur est de " +
        aggregates.revenue.footprint.indicators.eco.value +
        "% pour le chiffre d'affaires, en prenant compte des stocks de production."
    );
  } else {
    currentParagraph.push(
      "La valeur est identique pour le chiffre d'affaires."
    );
  }

  analysis.push(currentParagraph);

  return analysis;
};
