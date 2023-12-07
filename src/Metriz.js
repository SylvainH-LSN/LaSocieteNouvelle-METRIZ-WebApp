// La Société Nouvelle

// React / Next
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";

// Error Handler
import ErrorBoundary from "/src/utils/ErrorBoundary";

// Sections
import { StartSection } from "/src/components/sections/start/StartSection";
import { AccountingImportSection } from "/src/components/sections/accountingImport";
import { InitialStatesSection } from "/src/components/sections/initialStates";
import ProvidersSection from "/src/components/sections/providers";
import DirectImpacts from "/src/components/sections/statements";
import Results from "/src/components/sections/results";
import PublishStatementSection from "/src/components/sections/publishStatement";

// Others components
import { HeaderSection } from "/src/components/pageComponents/HeaderSection";
import { HeaderPublish } from "/src/components/pageComponents/HeaderPublish";
import { Footer } from "/src/components/pageComponents/Footer";

// Logs
import { logUserProgress, sendAnonymousStatReport } from "./statReportService/StatReportService";

// Utils
import { getMoreRecentYearlyPeriod } from "/src/utils/periodsUtils";
import { 
  checkExternalFootprints, 
  checkFinancialData, 
  checkImpactsStatements, 
  checkInitialStates, 
  getProgression 
} from "./utils/progressionUtils";

// Modal
import SaveModal from "./components/modals/SaveModal";

/* ------------------------------------------------------------------------------------- */
/* ---------------------------------------- APP ---------------------------------------- */
/* ------------------------------------------------------------------------------------- */

export const Metriz = () => 
{
  const [session, setSession] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState({});
  const [step, setStep] = useState(0);
  const [stepMax, setStepMax] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false); 

  const currentDate = new Date();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
    sessionDidUpdate();
  }, [step]); 


  // Update state -------------------------------------


  const updateSelectedPeriod = (period) => {
    setSelectedPeriod(period);
  };

  const updateStep = (nextStep) => {
    setStep(nextStep);
  };

  const handleSessionSaved = () => {
    setSessionSaved(true);
  };

  const sessionDidUpdate = async () => {
    let progression = await getProgression(session,selectedPeriod);
    if (selectedPeriod.periodKey && progression<5) {
      session.initNetValueAddedFootprint(selectedPeriod);
    }
    setStepMax(progression);
  }

  // Init session -------------------------------------

  const initSession = (session) => 
  {
    // console logs
    console.log("--------------------------------------------------");
    console.log("Initialisation d'une nouvelle session");
    console.log(session);

    setSession(session);
    setStep(1); 
  };

  const resumeSession = async (session) => 
  {
    let defaultPeriod = getMoreRecentYearlyPeriod(session.availablePeriods);
    let progression = await getProgression(session,defaultPeriod);

    setSession(session);
    setSelectedPeriod(defaultPeriod);
    setStep(progression);
  };

  // Validations --------------------------------------

  // imported data
  const validFinancialData = async () => 
  {
    // console logs
    console.log("--------------------------------------------------");
    console.log("[SESSION] Validation des données comptables");
    console.log("Données comptables : ", session.financialData);
    console.log(session.financialData);
    console.log("Objet session : ", session);

    // validation
    let stepValidation = checkFinancialData(session,selectedPeriod);
    if (!stepValidation) {
      // log error
    }

    // next step
    let initialStatesValidation = checkInitialStates(session,selectedPeriod);
    if (!initialStatesValidation) {
      setStep(2); // initial states section
    } else {
      setStep(3); // provider section
    }

    // server logs
    if (process.env.NODE_ENV === "production") {
      await logUserProgress(session.id, 1, currentDate, []);
    }
  };

  const validInitialStates = async () => 
  {
    // console logs
    console.log("--------------------------------------------------");
    console.log("[SESSION] Validation des états initiaux");
    console.log("Etats initiaux : ");
    console.log(session.financialData.immobilisations);
    console.log(session.financialData.stocks);
    console.log("Objet session : ", session);

    // validation
    let stepValidation = checkInitialStates(session,selectedPeriod);
    if (!stepValidation) {
      // log error
    }

    // server logs
    if (process.env.NODE_ENV === "production") {
      await logUserProgress(session.id, 2, currentDate, []);
    }

    // next step
    const progression = await getProgression(session,selectedPeriod);
    setStep(progression); // providers section
  };

  const validProviders = async () => 
  {
    // console logs
    console.log("--------------------------------------------------");
    console.log("[SESSION] Validation des empreintes fournisseurs");
    console.log("Données fournisseurs : ", session.financialData.providers);
    console.log("Objet session : ", session);

    // validation
    let stepValidation = checkExternalFootprints(session,selectedPeriod);
    if (!stepValidation) {
      // log error
    }
    
    // server logs
    if (process.env.NODE_ENV === "production") {
      await logUserProgress(session.id, 3, currentDate, []);
    }

    // next step
    const progression = await getProgression(session,selectedPeriod);
    setStep(progression); // providers section
  };

  const validStatements = async () => 
  {
    // console logs
    console.log("--------------------------------------------------");
    console.log("[SESSION] Validation des déclarations d'impacts directs");
    console.log("Données d'impacts : ",session.impactsData[selectedPeriod.periodKey]);
    console.log("Objet session : ", session);
    
    // validation
    let stepValidation = checkImpactsStatements(session,selectedPeriod);
    if (!stepValidation) {
      // log error
    }

    // server logs
    if (process.env.NODE_ENV === "production") {
      await logUserProgress(session.id, 4, currentDate, 
        session.validations[selectedPeriod.periodKey]);
    }

    // Anonymous stats report
    try {
      sendAnonymousStatReport(
        session,
        selectedPeriod
      );
    } catch (error) {
      console.log(error);
    }
    
    // next step
    const progression = await getProgression(session,selectedPeriod);
    setStep(progression); // results section
    if (progression==5) {
      setShowSaveModal(true);
    }
  };

  // Sections Views
  const buildSectionView = () => 
  {
    
    const sections = [
      <StartSection 
        initSession={initSession}
        resumeSession={resumeSession}
      />,
      <AccountingImportSection 
        session={session}
        period={selectedPeriod}
        onSelectPeriod={updateSelectedPeriod}
        submit={validFinancialData} 
      />,
      <InitialStatesSection
        session={session}
        sessionDidUpdate={sessionDidUpdate}
        period={selectedPeriod}
        submit={validInitialStates}
        onReturn={() => setStep(1)}
      />,
      <ProvidersSection
        session={session}
        sessionDidUpdate={sessionDidUpdate}
        period={selectedPeriod}
        submit={validProviders}
      />,
      <DirectImpacts
        session={session}
        sessionDidUpdate={sessionDidUpdate}
        period={selectedPeriod}
        submit={validStatements}
      />,
      <Results
        session={session}
        period={selectedPeriod}
        goBack={() => setStep(4)}
        publish={() => setStep(6)}
      />,
      <PublishStatementSection 
        session={session}
        period={selectedPeriod}
      />,
    ];

    return sections[step];
  };

  return (
    <>
      {/* Header */}
      <ErrorBoundary session={session}>
        {step > 0 && step < 6 && (
          <HeaderSection
            step={step}
            stepMax={stepMax}
            setStep={updateStep}
            session={session}
            period={selectedPeriod}
            onSelectPeriod={updateSelectedPeriod}
          />
        )}
        {step == 6 && (
          <HeaderPublish
            step={step}
            setStep={updateStep}
            session={session}
            period={selectedPeriod}
            onSelectPeriod={updateSelectedPeriod}
          />
        )}

        {/* Sections */}
        <div className={`app-container ${step === 0 ? '' : 'container-fluid'}`}>
          {buildSectionView(step)}
        </div>

        {/* Modal */}

        <SaveModal
          onSessionSaved={handleSessionSaved}
          session={session}
          showModal={showSaveModal && !sessionSaved}
          handleClose={() => setShowSaveModal(false)}
        ></SaveModal>
      </ErrorBoundary>

      {/* Footer */}
      <Footer />
    </>
  );
}