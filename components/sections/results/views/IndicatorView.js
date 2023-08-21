// La Société Nouvelle

// React
import React from "react";
import { Col, Row, Nav } from "react-bootstrap";

// Visuals
import { ComparisonsVisual } from "../components/ComparisonsVisual";
import { MainAggregatesTableVisual } from "../components/MainAggregatesTableVisual";
import { GrossImpactDistributionVisual } from "../components/GrossImpactDistributionVisual";
import { AnalysisNoteVisual } from "../components/AnalysisNoteVisual";
import { MainAggregatesFootprintsVisual } from "../components/MainAggregatesFootprintsVisual";
import { EvolutionCurvesVisual } from "../components/EvolutionCurvesVisual";

// Lib
import metaIndics from "/lib/indics";

/* ---------- INDICATOR VIEW ---------- */

/** Standard view for each indicator
 *  
 *  Props :
 *    - session
 *    - period
 * 
 *  Args :
 *    - indic (code)
 * 
 *  Structure :
 *    - SIG/External expenses tables
 *    - SIG Footprints diagramm
 *    - Comparative diagrams & table
 *    - Graphic with historical, trend & target
 *    - Analysis note
 * 
 */

export const IndicatorView = ({
  session,
  period,
  indic
}) => {

  const metaIndic = metaIndics[indic];

  return (
    <>
      {/* Menu */}
      <div className="box">
        <Nav variant="underline" defaultActiveKey="/home">
          <Nav.Item>
            <Nav.Link href="/#rapport">Analyse extra-financière</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/#comparaisons">Comparaison par activité</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/#evolution">Courbes d'évolution</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/#analyse">Note d'analyse</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {/* SIG and external expenses table */}
      <Row>
        <Col>
          <MainAggregatesTableVisual
            session={session}
            period={period}
            indic={indic}
          />
        </Col>

        {/* ----------Gross Impact Chart ----------  */}
        {(metaIndic.type === "intensité") && (
          <Col lg={4}>
            <GrossImpactDistributionVisual
              session={session}
              period={period}
              indic={indic}
            />
          </Col>
        )}
      </Row>

      {/* ---------Comparative data charts & Table ----------  */}
      {(metaIndic.type === "proportion") && (
        <MainAggregatesFootprintsVisual
          session={session}
          period={period}
          indic={indic}
        />
      )}

      {/* ---------Comparative data charts & Table ----------  */}
      <ComparisonsVisual
        session={session}
        period={period}
        indic={indic}
      />

      {/* ---------- Evolution Curves Chart ----------  */}
      <EvolutionCurvesVisual
        session={session}
        period={period}
        indic={indic}
      />

      {/* ---------- Analysis Note Text  ----------  */}
      <AnalysisNoteVisual
        session={session}
        period={period}
        indic={indic}
      />
    </>
  );
}