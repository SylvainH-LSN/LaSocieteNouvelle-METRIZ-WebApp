// La Société Nouvelle

// React
import React from "react";
import Dropzone from "react-dropzone";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faWarning, faSync, faChevronRight, faFile } from "@fortawesome/free-solid-svg-icons";


// Components
import { CompaniesTable } from "../tables/CompaniesTable";

// Writers
import { XLSXFileWriterFromJSON } from "../../src/writers/XLSXWriter";

// Readers
import { CSVFileReader, processCSVCompaniesData } from "/src/readers/CSVReader";
import { XLSXFileReader } from "/src/readers/XLSXReader";
import { ProgressBar } from "../popups/ProgressBar";
import { getSignificativeCompanies } from "../../src/formulas/significativeLimitFormulas";
import { DefaultCompaniesTable } from "../tables/DefaultCompaniesTable";

/* ----------------------------------------------------------- */
/* -------------------- COMPANIES SECTION -------------------- */
/* ----------------------------------------------------------- */

export class CompaniesSection extends React.Component {
  constructor(props) {
    super(props);
    this.onDrop = (files) => {
      this.setState({ files });
    };
    this.state = {
      companies: props.session.financialData.companies,
      significativeCompanies: [],
      view: "all",
      nbItems: 20,
      fetching: false,
      files: [],
      progression: 0,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0)
  }
  componentDidUpdate() {
 
    // change view to main if array of companies with data unfetched empty
    if (
      this.state.view == "unsync" &&
      this.state.companies.filter((company) => company.status != 200).length ==
      0
    )
      this.setState({ view: "all" });

    // update significative companies array
    if (
      this.state.significativeCompanies.length == 0 &&
      this.state.companies.filter((company) => company.status != 200).length ==
      0
    ) {
      let significativeCompanies = getSignificativeCompanies(
        this.props.session.financialData
      );
      this.setState({ significativeCompanies });
    }
  }

  render() {
    const {
      companies,
      significativeCompanies,
      view,
      nbItems,
      fetching,
      progression,
      files,
      
    } = this.state;
    const financialData = this.props.session.financialData;

    // Filter commpanies showed
    const companiesShowed = filterCompanies(
      companies,
      view,
      significativeCompanies
    );

    // check synchro
    const isNextStepAvailable = nextStepAvailable(this.state);

    return (
      <>
        <section className="container">

          <div className={"section-title"}>
            <h2>&Eacute;tape 4 - Traitement des fournisseurs</h2>
            <h3 className={"subtitle underline"}>
              Saisie des numéros de Siren
            </h3>
            <p>
              Les numéros de siren permettent de récupérer les données relatives aux fournisseurs
              au sein de notre base de données ouverte.
            </p>
          </div>
          <div>
            <p>
              Exportez un fichier excel contenant la liste des comptes fournisseurs auxiliaires pour
              compléter les numéros de siren, puis réimportez le document. Le fichier permet d'affecter
              les numéros de siren, il est ensuite nécessaire de synchroniser les données pour récupérer
              les données relatives aux fournisseurs.
            </p>
            <h4>
              &Eacute;tape 1 : Télécharger le tableaux des fournisseurs
            </h4>
            <button className="btn btn-secondary" onClick={this.exportXLSXFile}>
              Télécharger
            </button>

            <h4>
              &Eacute;tape 2 : Importer le fichier excel complété
            </h4>

            <Dropzone onDrop={this.onDrop} maxFiles={1} multiple={false} >
              {({ getRootProps, getInputProps }) => (
                <div className="dropzone-section">
                  <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    <p>
                      Glisser votre fichier
                      <span>
                        ou cliquez ici pour sélectionner votre fichier
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </Dropzone>
            {
              (files.length > 0) ?
                <button className={"btn btn-primary"} onClick={this.importFile}
                >
                  Importer mon fichier
                </button> :
                ""
            }
            {files.length > 0 && !isNextStepAvailable ?
              <p className="alert alert-info">
                Votre fichier a bien été importé ! Vous pouvez synchroniser vos données avec notre base de données pour récupérer les données relatives aux fournisseurs.
              </p>

              : ""}
          </div>
          <h4>&Eacute;tape 3 : Synchroniser vos données</h4>
          <div className="table-container">
   
            {
              isNextStepAvailable && (

                <p className={"alert alert-success"}>
                  <FontAwesomeIcon icon={faCheck} /> Vos données ont bien été synchronisées.
                </p>

              )
            }
            {
              !isNextStepAvailable ?
                <div className={"alert alert-warning"}>
                  <p>
                    <FontAwesomeIcon icon={faWarning} /> L'empreinte de
                    certains comptes ne sont pas initialisés.
                  </p>


                  <button
                    onClick={() => this.synchroniseShowed()}
                    className={"btn btn-warning"}
                  >
                    <FontAwesomeIcon icon={faSync} /> Synchroniser les
                    données
                  </button>
                </div> :
                <div className={"alert alert-warning"}>

                  <button
                    onClick={() => this.synchroniseShowed()}
                    className={"btn btn-warning"}
                  >
                    <FontAwesomeIcon icon={faSync} /> Synchroniser les nouvelles données
                  </button>
                </div>
            }
            {/* <p>
              Les comptes fournisseurs et autres comptes tiers correspondent aux
              entités exterieures vers lesquelles sont dirigés les charges
              externes et les investissements. Les "autres comptes tiers" font
              référence aux comptes par défaut résultants de l'impossibilité
              d'associer certains flux sortants à un compte fournisseur
              auxiliaire.
              <br />
              L'obtention des empreintes des comptes fournisseurs s'effectuent
              via leur numéro de siren.
            </p> */}

            {companies.length > 0 && (
              <div className="table-data">
                <div className="table-header">
                  <div className="pagination">
                    <div className="form-group">
                      <label> Pagination </label>
                      <select
                        value={nbItems}
                        onChange={this.changeNbItems}
                        className="form-input"
                      >
                        <option key="1" value="20">
                          20 fournisseurs par page
                        </option>
                        <option key="2" value="50">
                          50 fournisseurs par page
                        </option>
                        <option key="3" value="all">
                          Tous les fournisseurs
                        </option>
                      </select>
                    </div>
                    {companies.length > 0 && (
                      <div className="form-group">
                        <label> Affichage </label>
                        <select
                          value={view}
                          onChange={this.changeView}
                          className="form-input"
                        >
                          <option key="1" value="all">
                            Tous les comptes externes
                          </option>
                          <option key="2" value="aux">
                            Comptes fournisseurs uniquement
                          </option>
                          <option key="3" value="expenses">
                            Autres comptes tiers
                          </option>
                          {/* {!isNextStepAvailable && (
                            <option key="4" value="unsync">
                              Comptes non synchronisés
                            </option>
                          )} */}
                          {significativeCompanies.length > 0 && (
                            <option key="5" value="significative">
                              Comptes significatifs
                            </option>
                          )}
                          <option key="6" value="defaultActivity">
                            Comptes tiers non rattachés à un secteur
                            d'activités
                          </option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <CompaniesTable
                      nbItems={
                        nbItems == "all"
                          ? companiesShowed.length
                          : parseInt(nbItems)
                      }
                      onUpdate={this.updateFootprints.bind(this)}
                      companies={companiesShowed}
                      financialData={financialData}
                    /> 
                    
                                   {/* {
                  isNextStepAvailable  ?
   
                    :
                    <DefaultCompaniesTable
                      nbItems={
                        nbItems == "all"
                          ? companiesShowed.length
                          : parseInt(nbItems)
                      }
                      onUpdate={this.updateFootprints.bind(this)}
                      companies={companiesShowed}
                      financialData={financialData}
                    />
                } */}

              </div>
            )}
          </div>

          {fetching && (
            <div className="popup">
              <ProgressBar
                message="Récupération des données fournisseurs..."
                progression={progression}
              />
            </div>
          )}
        </section>
        <div className={"action container-fluid"}>
          <button
            className={"btn btn-secondary"}
            id="validation-button"
            disabled={!isNextStepAvailable}
            onClick={this.props.submit}
          >
            Valider les fournisseurs
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </>
    );
  }

  /* ---------- VIEW ---------- */

  changeView = (event) => this.setState({ view: event.target.value });
  changeNbItems = (event) => this.setState({ nbItems: event.target.value });

  /* ---------- UPDATES ---------- */

  updateFootprints = () => {
    this.props.session.updateFootprints();
    this.setState({ companies: this.props.session.financialData.companies });
  };

  /* ---------- FILE IMPORT ---------- */

  importFile = () => {
    let file = this.state.files[0];
    let extension = file.name.split(".").pop();
    switch (extension) {
      case "csv":
        this.importCSVFile(file);
        break;
      case "xlsx":
        this.importXLSXFile(file);
        break;
    }
  };

  // Import CSV File
  importCSVFile = (file) => {
    let reader = new FileReader();
    reader.onload = async () => {
      let CSVData = await CSVFileReader(reader.result);
      let companiesIds = await processCSVCompaniesData(CSVData);
      await Promise.all(
        Object.entries(companiesIds).map(async ([corporateName, corporateId]) =>
          this.props.session.financialData.updateCorporateId(
            corporateName,
            corporateId
          )
        )
      );
      this.setState({ companies: this.props.session.financialData.companies });
    };

    reader.readAsText(file);

  };

  // Import XLSX File
  importXLSXFile = (file) => {
    let reader = new FileReader();
    reader.onload = async () => {
      let XLSXData = XLSXFileReader(reader.result);
      await Promise.all(
        XLSXData.map(async ({ denomination, siren }) =>
          this.props.session.financialData.updateCorporateId(
            denomination,
            siren
          )
        )
      );
      this.setState({ companies: this.props.session.financialData.companies });
    };

    reader.readAsArrayBuffer(file);
  };

  /* ---------- FILE EXPORT ---------- */

  // Export CSV File
  exportXLSXFile = async () => {
    let jsonContent = await this.props.session.financialData.companies
      .filter((company) => company.account.charAt(0) != "_")
      .map((company) => {
        return {
          denomination: company.corporateName,
          siren: company.corporateId,
        };
      });
    let fileProps = { wsclos: [{ wch: 50 }, { wch: 20 }] };

    // write file (JSON -> ArrayBuffer)
    let file = await XLSXFileWriterFromJSON(
      fileProps,
      "fournisseurs",
      jsonContent
    );

    // trig download
    let blob = new Blob([file], { type: "application/octet-stream" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "fournisseurs.xlsx";
    link.click();
  };

  /* ---------- FETCHING DATA ---------- */

  // Synchronisation showed
  synchroniseShowed = async () => {
    let { companies, view } = this.state;
    let significativeAccounts =
      view == "significative" ? getSignificativeCompanies(financialData) : [];
    let companiesShowed = filterCompanies(
      companies,
      view,
      significativeAccounts
    );
    await this.synchroniseCompanies(companiesShowed);
  };

  synchroniseCompanies = async (companiesToSynchronise) => {
    // synchronise data
    this.setState({ fetching: true, progression: 0 });

    let i = 0;
    let n = companiesToSynchronise.length;
    for (let company of companiesToSynchronise) {
        await company.updateFromRemote()
      i++;
      this.setState({ progression: Math.round((i / n) * 100) });
    }

    // update view
    if (
      this.state.view == "all" &&
      this.state.companies.filter((company) => company.status != 200).length > 0
    )
      this.state.view = "unsync";

    // update signficative companies
    if (
      this.state.companies.filter((company) => company.status != 200).length ==
      0
    )
      this.state.significativeCompanies = getSignificativeCompanies(
        this.props.session.financialData
      );

    // update state
    this.setState({ fetching: false, progression: 0 , synchronised : true });

    // update session
    this.props.session.updateFootprints();
  };
}

/* -------------------------------------------------- ANNEXES -------------------------------------------------- */

const nextStepAvailable = ({ companies }) =>
// condition : data fetched for all companies (or no company with data unfetched)
{
  return !(companies.filter((company) => company.status != 200).length > 0);
};

/* ---------- DISPLAY ---------- */

const filterCompanies = (companies, view, significativeCompanies) => {
  switch (view) {
    case "aux":
      return companies.filter((company) => !company.isDefaultAccount);
    case "expenses":
      return companies.filter((company) => company.isDefaultAccount);
    case "undefined":
      return companies.filter((company) => company.state != "siren");
    case "unsync":
      return companies.filter((company) => company.status != 200);
    case "defaultActivity":
      return companies.filter(
        (company) =>
          company.state == "default" &&
          (company.footprintActivityCode == "00" ||
            company.footprintActivityCode == "TOTAL")
      );
    case "significative":
      return significativeCompanies;
    default:
      return companies;
  }
};