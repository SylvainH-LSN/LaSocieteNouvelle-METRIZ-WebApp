// La Société Nouvelle

// React
import React from 'react';

// Libraries
import booksProps from '../../lib/books.json'

/* ---------- FEC IMPORT POP-UP ---------- */

export class FECImportPopup extends React.Component {

  constructor(props) {
    super(props);
    this.state = props.FECData;
  }

  render() 
  {
    const {meta,books} = this.state;

    return (
      <div className="popup">
        <div className="popup-inner">
          <h3>Journaux disponibles</h3>
          <table>
            <thead>
              <tr>
                <td className="short center">Code</td>
                <td className="long center">Libellé</td>
                <td className="short center">Début</td>
                <td className="short center">Fin</td>
                <td className="short center">Lignes</td>
                <td className="medium center">Type</td>
              </tr>
            </thead>
            <tbody>
              {Object.entries(meta.books).sort()
                                         .map(([code,{label,type}]) => {
                const nLines = books[code].length;
                const dateStart = books[code][0].EcritureDate;
                const dateEnd = books[code][nLines-1].EcritureDate;
                return(
                  <tr key={code}>
                    <td className="short center">{code}</td>
                    <td className="long left">{label}</td>
                    <td className="short center">{dateStart.substring(6,8)+"/"+dateStart.substring(4,6)+"/"+dateStart.substring(0,4)}</td>
                    <td className="short center">{dateEnd.substring(6,8)+"/"+dateEnd.substring(4,6)+"/"+dateEnd.substring(0,4)}</td>
                    <td className="short center">{nLines}</td>
                    <td className="medium center">
                      <select onChange={(event) => this.onBookTypeChange(code,event)} value={type}>
                        {Object.entries(booksProps).map(([type,{label}]) => <option key={type} value={type}>{label}</option>)}
                        <option key={"AUTRE"} value={"AUTRE"}>{"---"}</option>
                  </select></td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
          <div className="footer">
            <button onClick={() => this.validate()}>Valider</button>
          </div>
        </div>
      </div>
    )
  }

  /* ----- EDIT ----- */

  onBookTypeChange = (code,event) => 
  {
    let meta = this.state.meta;
    meta.books[code].type = event.target.value;
    this.setState({meta: meta});
  }

  /* ----- PROPS METHODS ----- */

  validate = () => this.props.onValidate({...this.state})

}