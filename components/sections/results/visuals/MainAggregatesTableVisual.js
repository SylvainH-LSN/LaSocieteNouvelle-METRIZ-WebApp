// La Société Nouvelle

import { Tab, Tabs } from "react-bootstrap";
import { IndicatorMainAggregatesTable } from "../tables/IndicatorMainAggregatesTable";
import { ExpensesTable } from "../tables/ExpensesTable";

export const MainAggregatesTableVisual = ({
  session,
  period,
  indic
}) => {

  return (
    <div id="rapport" className="box p-4">
      <h4>Rapport - Analyse extra-financière</h4>
      <Tabs
        defaultActiveKey="mainAggregates"
        transition={false}
        id="noanim-tab-example"
      >
        <Tab
          eventKey="mainAggregates"
          title=" Soldes intermédiaires de gestion"
        >
          <IndicatorMainAggregatesTable
            session={session}
            period={period}
            indic={indic}
          />
        </Tab>
        <Tab
          eventKey="expensesAccounts"
          title=" Détails - Comptes de charges"
        >
          <ExpensesTable
            session={session}
            period={period}
            indic={indic}
          />
        </Tab>
      </Tabs>
    </div>
  );
};