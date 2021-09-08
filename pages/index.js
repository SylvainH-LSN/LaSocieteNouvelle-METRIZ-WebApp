// La Société Nouvelle

// Style
import styles from '../styles/Home.module.css';

// React / Next
import React from 'react';
import Head from 'next/head';

// Objects
import {Session} from '/src/Session.js';

// Sections
import { LegalDataSection } from '/components/sections/LegalDataSection.js';
import { FinancialDataSection } from '../components/FinancialDataSection';
import { CompaniesSection } from '../components/CompaniesSection';
import { InitialStatesSection } from '../components/InitialStatesSection';
import { IndicatorSection } from '../components/IndicatorSection';

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
    const {selectedSection} = this.state;

    return (
      <div className="app-view">
        <Menu selectedSection={selectedSection} 
              changeSection={this.changeSection.bind(this)}
              downloadSession={this.downloadSession.bind(this)}
              importSession={this.importSession.bind(this)}/>
        <div className="section-container">
          {this.buildSectionView()}
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
      const backUp = JSON.parse(reader.result);

      // JSON -> session
      const session = new Session();
      await session.updateFromBackUp(backUp);
      this.setState({
        session: session,
        selectedSection: "legalData"
      })
    }
    reader.readAsText(file);
  }

  /* ----- SECTION ----- */

  // ...redirect to the selected section
  buildSectionView()
  {
    const {selectedSection,session} = this.state;

    switch(selectedSection)
    {
      case "legalData" : return(<LegalDataSection session={session}/>)
      case "financialData" : return(<FinancialDataSection session={session}/>)
      case "companies" : return(<CompaniesSection session={session}/>)
      case "initialStates" : return(<InitialStatesSection session={session}/>)
      case "art" : return(<IndicatorSection session={session} indic="art"/>)
      case "dis" : return(<IndicatorSection session={session} indic="dis"/>)
      case "eco" : return(<IndicatorSection session={session} indic="eco"/>)
      case "geq" : return(<IndicatorSection session={session} indic="geq"/>)
      case "ghg" : return(<IndicatorSection session={session} indic="ghg"/>)
      case "haz" : return(<IndicatorSection session={session} indic="haz"/>)
      case "knw" : return(<IndicatorSection session={session} indic="knw"/>)
      case "mat" : return(<IndicatorSection session={session} indic="mat"/>)
      case "nrg" : return(<IndicatorSection session={session} indic="nrg"/>)
      case "soc" : return(<IndicatorSection session={session} indic="soc"/>)
      case "was" : return(<IndicatorSection session={session} indic="was"/>)
      case "wat" : return(<IndicatorSection session={session} indic="wat"/>)
    }
  }

}