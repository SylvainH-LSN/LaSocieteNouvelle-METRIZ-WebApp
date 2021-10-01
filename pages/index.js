// La Société Nouvelle

// Style
import styles from '../styles/Home.module.css';

// React / Next
import React from 'react';
import Head from 'next/head';

// Objects
import { Session } from '/src/Session';

// Sections
import { LegalDataSection } from '/components/sections/LegalDataSection';
import { FinancialDataSection } from '/components/sections/FinancialDataSection';
import { CompaniesSection } from '/components/sections/CompaniesSection';
import { InitialStatesSection } from '/components/sections/InitialStatesSection';
import { IndicatorSection } from '/components/sections/IndicatorSection';

// Others components
import { Menu } from '../components/Menu';

/*   _________________________________________________________________________________________________________
 *  |                                                                                                         |
 *  |   _-_ _-_- -_-_                                                                                         |
 *  |   -\-_\/-_-_/_-                                                                                         |
 *  |    -|_ \  / '-                  ___   __   __ .  __  ___  __          __               __          __   |
 *  |    _-\_-|/  _ /    |     /\    |     |  | |   | |     |  |     |\  | |  | |  | \    / |   |   |   |     |
 *  |        ||    |     |    /__\   |---| |  | |   | |-    |  |-    | \ | |  | |  |  \  /  |-  |   |   |-    |
 *  |       _||_  /'\    |__ /    \   ___| |__| |__ | |__   |  |__   |  \| |__| |__|   \/   |__ |__ |__ |__   |
 *  |                                                                                                         |
 *  |                                                                             Let's change the world...   |
 *  |_________________________________________________________________________________________________________|
 */


/* ---------------------------------------------- */
/* -------------------- HOME -------------------- */
/* ---------------------------------------------- */

export default function Home() 
{
  return (
    <div className={styles.container}>

      <Head>
        <title>METRIZ by La Société Nouvelle</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.jpg" />
      </Head>

      <Metriz/>
      
    </div>
  )
}

/* --------------------------------------------- */
/* -------------------- APP -------------------- */
/* --------------------------------------------- */

/* Notes :
 * 
 */

class Metriz extends React.Component {

  constructor(props) 
  {
    super(props);
    this.state = 
    {
      session: new Session(),
      selectedSection: "legalData",
    }
  }

  render() 
  {
    const {selectedSection,session} = this.state;

    const progression = {
      legalUnitOK: session.legalUnit.dataFetched && /[0-9]{4}/.test(session.legalUnit.year),
      financialDataOK: session.financialData.isFinancialDataLoaded,
      companiesOK: !(session.financialData.companies.filter(company => company.status != 200).length > 0),
      initialStatesOK: !(session.financialData.immobilisations.concat(session.financialData.stocks).filter(account => account.initialState=="defaultData" && !account.dataFetched).length > 0)
    }

    return (
      <div className="app-view">
        <Menu selectedSection={selectedSection} 
              progression={progression}
              changeSection={this.changeSection.bind(this)}
              downloadSession={this.downloadSession.bind(this)}
              importSession={this.importSession.bind(this)}/>
        <div className="section-container">
          {this.buildSectionView(selectedSection)}
        </div>
      </div>
    )
  }

  // change selected session
  changeSection = (nextSelectedSection) => this.setState({selectedSection: nextSelectedSection})

  // download session (session -> JSON data)
  downloadSession = async () => 
  {
    // build JSON
    const session = this.state.session;
    const fileName = "svg_ese_"+session.getUniteLegale().siren; // To update
    const json = JSON.stringify(session);

    // build download link & activate
    const blob = new Blob([json],{type:'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
          link.href = href;
          link.download = fileName + ".json";    
          link.click();
  }

  // import session (JSON data -> session)
  importSession = (file) =>
  {
    const reader = new FileReader();
    reader.onload = async () => 
    {
      // text -> JSON
      const prevProps = JSON.parse(reader.result);

      // JSON -> session
      const session = new Session(prevProps);
      
      this.setState({
        session: session,
        selectedSection: "legalData"
      })
    }
    reader.readAsText(file);
  }

  /* ----- SECTION ----- */

  // ...redirect to the selected section
  buildSectionView = (selectedSection) =>
  {
    const {session} = this.state;

    const sectionProps = {
      session: session,
      updateMenu: () => this.changeSection.bind(this)(selectedSection)
    }

    switch(selectedSection)
    {
      case "legalData" : return(<LegalDataSection {...sectionProps}/>)
      case "financialData" : return(<FinancialDataSection {...sectionProps}/>)
      case "companies" : return(<CompaniesSection {...sectionProps}/>)
      case "initialStates" : return(<InitialStatesSection {...sectionProps}/>)
      case "art" : return(<IndicatorSection {...sectionProps} indic="art"/>)
      case "dis" : return(<IndicatorSection {...sectionProps} indic="dis"/>)
      case "eco" : return(<IndicatorSection {...sectionProps} indic="eco"/>)
      case "geq" : return(<IndicatorSection {...sectionProps} indic="geq"/>)
      case "ghg" : return(<IndicatorSection {...sectionProps} indic="ghg"/>)
      case "haz" : return(<IndicatorSection {...sectionProps} indic="haz"/>)
      case "knw" : return(<IndicatorSection {...sectionProps} indic="knw"/>)
      case "mat" : return(<IndicatorSection {...sectionProps} indic="mat"/>)
      case "nrg" : return(<IndicatorSection {...sectionProps} indic="nrg"/>)
      case "soc" : return(<IndicatorSection {...sectionProps} indic="soc"/>)
      case "was" : return(<IndicatorSection {...sectionProps} indic="was"/>)
      case "wat" : return(<IndicatorSection {...sectionProps} indic="wat"/>)
    }
  }

  /* ----- PROGESSION ---- */

  getProgression = (session) =>
  {
    const progression = {
      legalUnitOK: session.legalUnit.dataFetched && /[0-9]{4}/.test(session.legalUnit.year),
      financialDataOK: session.financialData.isFinancialDataLoaded,
      companiesOK: !(session.financialData.companies.filter(company => company.status != 200).length > 0),
      initialStatesOK: !(session.financialData.immobilisations.concat(session.financialData.stocks).filter(account => account.initialState=="defaultData" && !account.dataFetched).length > 0)
    }
    return progression;
  }

}