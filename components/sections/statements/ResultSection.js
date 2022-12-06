import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Dropdown,
  DropdownButton,
  Image,
  Row,
  Tab,
  Tabs,
} from "react-bootstrap";

import Select from "react-select";

// Meta
import metaIndics from "/lib/indics";
import divisions from "/lib/divisions";

// Texts imports
import { analysisTextWriterART } from "../../../src/writers/analysis/analysisTextWriterART";
import { analysisTextWriterDIS } from "../../../src/writers/analysis/analysisTextWriterDIS";
import { analysisTextWriterECO } from "../../../src/writers/analysis/analysisTextWriterECO";
import { analysisTextWriterGEQ } from "../../../src/writers/analysis/analysisTextWriterGEQ";
import { analysisTextWriterGHG } from "../../../src/writers/analysis/analysisTextWriterGHG";
import { analysisTextWriterHAZ } from "../../../src/writers/analysis/analysisTextWriterHAZ";
import { analysisTextWriterKNW } from "../../../src/writers/analysis/analysisTextWriterKNW";
import { analysisTextWriterMAT } from "../../../src/writers/analysis/analysisTextWriterMAT";
import { analysisTextWriterNRG } from "../../../src/writers/analysis/analysisTextWriterNRG";
import { analysisTextWriterSOC } from "../../../src/writers/analysis/analysisTextWriterSOC";
import { analysisTextWriterWAS } from "../../../src/writers/analysis/analysisTextWriterWAS";
import { analysisTextWriterWAT } from "../../../src/writers/analysis/analysisTextWriterWAT";
import { exportIndicPDF } from "../../../src/writers/Export";

// API
import { ErrorApi } from "../../ErrorAPI";

// Graphs
import ComparativeGraphs from "../../graphs/ComparativeGraphs";
import PieGraph from "../../graphs/PieGraph";

// Tables
import { ComparativeTable } from "../../tables/ComparativeTable";
import { IndicatorExpensesTable } from "../../tables/IndicatorExpensesTable";
import { IndicatorMainAggregatesTable } from "../../tables/IndicatorMainAggregatesTable";

import getMacroSerieData from "/src/services/responses/MacroSerieData";
import getHistoricalSerieData from "/src/services/responses/HistoricalSerieData";

import TrendsGraph from "../../graphs/TrendsGraph";

const ResultSection = (props) => {
  const [indic, setIndic] = useState(props.indic);
  const [session] = useState(props.session);
  const [error] = useState(false);
  const [comparativeDivision, setComparativeDivision] = useState(
    props.session.comparativeData.activityCode
  );
  const [comparativeData, setComparativeData] = useState(
    props.session.comparativeData
  );

  const [printGrossImpact] = useState([
    "ghg",
    "haz",
    "mat",
    "nrg",
    "was",
    "wat",
  ]);

  const [divisionsOptions, setDivisionsOptions] = useState([]);

  useEffect(() => {
    let options = [];
    //Divisions select options
    Object.entries(divisions)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(([value, label]) => {
        if (value != "00") {
          options.push({ value: value, label: value + " - " + label });
        }
      });

    setDivisionsOptions(options);
  }, []);

  const { intermediateConsumption, capitalConsumption, netValueAdded } =
    props.session.financialData.aggregates;

  const changeComparativeDivision = async (event) => {
    let division = event.value;
    // update session
    props.session.comparativeData.activityCode = division;

    await updateComparativeData(division);
    setComparativeDivision(division);
  };

  const updateComparativeData = async (division) => {

    let newComparativeData = comparativeData;

    newComparativeData = await getMacroSerieData(
      indic,
      division,
      newComparativeData,
      "divisionFootprint"
    );

    newComparativeData = await getHistoricalSerieData(
      division,
      indic,
      newComparativeData,
      "trendsFootprint"
    );

    newComparativeData = await getHistoricalSerieData(
      division,
      indic,
      newComparativeData,
      "targetDivisionFootprint"
    );

    props.session.comparativeData = newComparativeData;
    setComparativeData(newComparativeData);
  };

  return (
    <>
      <div className="step d-flex  align-items-center justify-content-between">
        <h2>
          <i className="bi bi-clipboard-data"></i> Rapport - Analyse
          extra-financière
        </h2>
        <div className="d-flex">
          <Button variant="light" onClick={props.goBack}>
            <i className="bi bi-chevron-left"></i> Retour
          </Button>

          {session.validations.length > 1 ? (
            <DropdownButton id="indic-button" title="Autres résultats">
              {Object.entries(metaIndics).map(([key, value]) => {
                if (session.validations.includes(key) && key != indic) {
                  return (
                    <Dropdown.Item
                      className="small-text"
                      key={key}
                      onClick={() => setIndic(key)}
                    >
                      {value.libelle}
                    </Dropdown.Item>
                  );
                }
              })}
            </DropdownButton>
          ) : (
            <Button id="indic-button" disabled>
              {metaIndics[indic].libelle}
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() =>
              exportIndicPDF(
                indic,
                session,
                comparativeDivision,
                "#Production",
                "#Consumption",
                "#Value",
                "#CapitalConsumption",
                printGrossImpact.includes(indic) ? "#PieChart" : ""
              )
            }
          >
            Télécharger le rapport <i className="bi bi-download"></i>
          </Button>
        </div>
      </div>
      <section className="step">
        <div className="d-flex align-items-center mb-4 rapport-indic">
          <Image
            src={"/resources/icon-ese-bleues/" + indic + ".png"}
            className="icon-ese me-2"
          />
          <h3>{metaIndics[indic].libelle}</h3>
        </div>
        <Row>
          <Col lg={printGrossImpact.includes(indic) ? "9" : "12"}>
            <Tabs
              defaultActiveKey="mainAggregates"
              transition={false}
              id="noanim-tab-example"
              className="mb-3"
            >
              <Tab
                eventKey="mainAggregates"
                title=" Soldes intermédiaires de gestion"
              >
                <IndicatorMainAggregatesTable session={session} indic={indic} />
              </Tab>
              <Tab
                eventKey="expensesAccounts"
                title=" Détails - Comptes de charges"
              >
                <IndicatorExpensesTable session={session} indic={indic} />
              </Tab>
            </Tabs>
          </Col>
          {printGrossImpact.includes(indic) && (
            <Col sm={3}>
              <div className="border mt-5">
                <h3 className="text-center">
                  Répartition des impacts bruts (en %)
                </h3>
                <PieGraph
                  intermediateConsumption={intermediateConsumption.footprint.indicators[
                    indic
                  ].getGrossImpact(intermediateConsumption.amount)}
                  capitalConsumption={capitalConsumption.footprint.indicators[
                    indic
                  ].getGrossImpact(capitalConsumption.amount)}
                  netValueAdded={netValueAdded.footprint.indicators[
                    indic
                  ].getGrossImpact(netValueAdded.amount)}
                />
              </div>
            </Col>
          )}
        </Row>
      </section>
      <section className="step">
        <h3>Comparaison par activité</h3>

        <Select
          className="mb-3 small-text"
          defaultValue={{
            label: comparativeDivision + " - " + divisions[comparativeDivision],
            value: comparativeDivision,
          }}
          placeholder={"Choisissez un secteur d'activité"}
          options={divisionsOptions}
          onChange={changeComparativeDivision}
        />

        {error && <ErrorApi />}
        <div className="graph-container">
          <div className="mt-5">
            <Row className="graphs">
              <Col sm={3} xl={3} lg={3} md={3}>
                <h5 className="mb-4">▪ Production</h5>
                <ComparativeGraphs
                  id="Production"
                  comparativeData={[
                    comparativeData.production.areaFootprint.indicators[indic]
                      .value,
                    session.financialData.aggregates.production.footprint.getIndicator(
                      indic
                    ).value,
                    comparativeData.production.divisionFootprint.indicators[
                      indic
                    ].value,
                  ]}
                  targetData={[
                    comparativeData.production.targetAreaFootprint.indicators[
                      indic
                    ].value,
                    null,
                    comparativeData.production.targetDivisionFootprint
                      .indicators[indic].at(-1).value,
                  ]}
                  indic={indic}
                />
              </Col>
              <Col sm={3} xl={3} lg={3} md={3}>
                <h5 className="mb-4">▪ Consommations intermédiaires</h5>
                <ComparativeGraphs
                  id="Consumption"
                  comparativeData={[
                    comparativeData.intermediateConsumption.areaFootprint
                      .indicators[indic].value,
                    session.financialData.aggregates.intermediateConsumption.footprint.getIndicator(
                      indic
                    ).value,
                    comparativeData.intermediateConsumption.divisionFootprint
                      .indicators[indic].value,
                  ]}
                  targetData={[
                    comparativeData.intermediateConsumption.targetAreaFootprint
                      .indicators[indic].value,
                    null,
                    comparativeData.intermediateConsumption
                      .targetDivisionFootprint.indicators[indic].at(-1).value,
                  ]}
                  indic={indic}
                />
              </Col>
              <Col sm={3} xl={3} lg={3} md={3}>
                <h5 className="mb-4">▪ Consommation de capital fixe</h5>
                <ComparativeGraphs
                  id="CapitalConsumption"
                  comparativeData={[
                    comparativeData.fixedCapitalConsumption.areaFootprint
                      .indicators[indic].value,
                    session.financialData.aggregates.capitalConsumption.footprint.getIndicator(
                      indic
                    ).value,
                    comparativeData.fixedCapitalConsumption.divisionFootprint
                      .indicators[indic].value,
                  ]}
                  targetData={[
                    comparativeData.fixedCapitalConsumption.targetAreaFootprint
                      .indicators[indic].value,
                    null,
                    comparativeData.fixedCapitalConsumption
                      .targetDivisionFootprint.indicators[indic].at(-1).value,
                  ]}
                  indic={indic}
                />
              </Col>

              <Col sm={3} xl={3} lg={3} md={3}>
                <h5 className="mb-4">▪ Valeur ajoutée nette</h5>
                <ComparativeGraphs
                  id="Value"
                  comparativeData={[
                    comparativeData.netValueAdded.areaFootprint.indicators[
                      indic
                    ].value,
                    session.financialData.aggregates.netValueAdded.footprint.getIndicator(
                      indic
                    ).value,
                    comparativeData.netValueAdded.divisionFootprint.indicators[
                      indic
                    ].value,
                  ]}
                  targetData={[
                    comparativeData.netValueAdded.targetAreaFootprint
                      .indicators[indic].value,
                    null,
                    comparativeData.netValueAdded.targetDivisionFootprint
                      .indicators[indic].at(-1).value,
                  ]}
                  indic={indic}
                />
              </Col>
            </Row>
          </div>
        </div>

        <ComparativeTable
          financialData={session.financialData}
          indic={indic}
          comparativeData={comparativeData}
        />
      </section>
      {Array.isArray(
        comparativeData.production.trendsFootprint.indicators[indic]
      ) && (
        <section className="step">
          <h3>Courbes d'évolution</h3>
          <Row>
            <Col lg={8}>
              <TrendsGraph
                title="Production"
                unit={metaIndics[indic].unit}
                trends={
                  comparativeData.production.trendsFootprint.indicators[indic]
                }
                target={
                  comparativeData.production.targetDivisionFootprint.indicators[
                    indic
                  ]
                }
                current={
                  session.financialData.aggregates.production.footprint.getIndicator(
                    indic
                  ).value
                }
              />
              <div className="hidden">
                <TrendsGraph
                  title="Consommations intermédiaires"
                  unit={metaIndics[indic].unit}
                  trends={
                    comparativeData.intermediateConsumption.trendsFootprint
                      .indicators[indic]
                  }
                  target={
                    comparativeData.intermediateConsumption
                      .targetDivisionFootprint.indicators[indic]
                  }
                  current={
                    session.financialData.aggregates.intermediateConsumption.footprint.getIndicator(
                      indic
                    ).value
                  }
                />
              </div>
              <div className="hidden">
                <TrendsGraph
                  title="Consommation de capital fixe"
                  unit={metaIndics[indic].unit}
                  trends={
                    comparativeData.fixedCapitalConsumption.trendsFootprint
                      .indicators[indic]
                  }
                  target={
                    comparativeData.fixedCapitalConsumption
                      .targetDivisionFootprint.indicators[indic]
                  }
                  current={
                    session.financialData.aggregates.capitalConsumption.footprint.getIndicator(
                      indic
                    ).value
                  }
                />
              </div>
              <div className="hidden">
                <TrendsGraph
                  title="Valeur ajoutée nette"
                  unit={metaIndics[indic].unit}
                  trends={
                    comparativeData.netValueAdded.trendsFootprint.indicators[
                      indic
                    ]
                  }
                  target={
                    comparativeData.netValueAdded.targetDivisionFootprint
                      .indicators[indic]
                  }
                  current={
                    session.financialData.aggregates.netValueAdded.footprint.getIndicator(
                      indic
                    ).value
                  }
                />
              </div>
            </Col>
          </Row>
        </section>
      )}

      <section className="step">
        <h3>Note d'analyse</h3>
        <div id="analyse">
          <Analyse indic={indic} session={session} />
        </div>
      </section>
      <section className="step">
        <div className="d-flex justify-content-end">
          <Button variant="light" onClick={props.goBack}>
            <i className="bi bi-chevron-left"></i> Retour
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              exportIndicPDF(
                indic,
                session,
                comparativeDivision,
                "#Production",
                "#Consumption",
                "#Value",
                printGrossImpact.includes(indic) ? "#PieChart" : ""
              )
            }
          >
            Télécharger le rapport <i className="bi bi-download"></i>
          </Button>
        </div>
      </section>
    </>
  );
};

/* ----- STATEMENTS / ASSESSMENTS COMPONENTS ----- */

const Analyse = (indic, session) => {
  let analyse = getAnalyse(indic, session);

  return (
    <>
      {analyse.map((paragraph, index) => (
        <p key={index}>{paragraph.reduce((a, b) => a + " " + b)}</p>
      ))}
    </>
  );
};

// Display the correct statement view according to the indicator
function getAnalyse(props) {
  switch (props.indic) {
    case "art":
      return analysisTextWriterART(props.session);
    case "dis":
      return analysisTextWriterDIS(props.session);
    case "eco":
      return analysisTextWriterECO(props.session);
    case "geq":
      return analysisTextWriterGEQ(props.session);
    case "ghg":
      return analysisTextWriterGHG(props.session);
    case "haz":
      return analysisTextWriterHAZ(props.session);
    case "knw":
      return analysisTextWriterKNW(props.session);
    case "mat":
      return analysisTextWriterMAT(props.session);
    case "nrg":
      return analysisTextWriterNRG(props.session);
    case "soc":
      return analysisTextWriterSOC(props.session);
    case "was":
      return analysisTextWriterWAS(props.session);
    case "wat":
      return analysisTextWriterWAT(props.session);
  }
}

export default ResultSection;
