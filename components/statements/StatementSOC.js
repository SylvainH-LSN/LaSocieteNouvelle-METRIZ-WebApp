// La Société Nouvelle

// React
import React from 'react';
import { printValue } from '../../src/utils/Utils';

/* ---------- DECLARATION - INDIC #SOC ---------- */

export class StatementSOC extends React.Component {

  constructor(props) 
  {
    super(props);
    this.state = {
      info : props.impactsData.comments.soc || ""
    }
  }

  render() 
  {
    const {hasSocialPurpose,netValueAdded} = this.props.impactsData;
    const {info} = this.state;

    let isValid = hasSocialPurpose!==null && netValueAdded!=null;

    return (
      <div className="statement">
        <div className="statement-item">
          <label>L'entreprise est-elle d'utilité sociale ou dotée d'une raison d'être ?</label>
          <div className="input-radio">
            <input type="radio" id="hasSocialPurpose"
                   value="true"
                   checked={hasSocialPurpose === true}
                   onChange={this.onSocialPurposeChange}/>
            <label>Oui</label>
          </div>
          <div className="input-radio">
            <input type="radio" id="hasSocialPurpose"
                   value="false"
                   checked={hasSocialPurpose === false}
                   onChange={this.onSocialPurposeChange}/>
            <label>Non</label>
          </div>
        </div>
        <div className="statement-comments">
          <label>Informations complémentaires</label>
          <textarea type="text" spellCheck="false"
                    value={info} 
                    onChange={this.updateInfo}
                    onBlur={this.saveInfo}/>
        </div>
        <div className="statement-validation">
          <button disabled={!isValid}
                  onClick={this.onValidate}>Valider</button>
        </div>
      </div>
    ) 
  }

  onSocialPurposeChange = (event) => 
  {
    let radioValue = event.target.value;
    switch(radioValue) {
      case "true": 
        this.props.impactsData.hasSocialPurpose = true; 
        break;
      case "false": 
        this.props.impactsData.hasSocialPurpose = false; 
        break;
    }
    this.props.onUpdate("soc");
    this.forceUpdate();
  }
  
  updateInfo = (event) => this.setState({info: event.target.value});
  saveInfo = () => this.props.impactsData.comments.soc = this.state.info;

  onValidate = () => this.props.onValidate()
}

export const writeStatementSOC = (doc,x,y,impactsData) =>
{
  doc.text("Valeur ajoutée artisanale : "+printValue(impactsData.craftedProduction,0)+" €"+(impactsData.isValueAddedCrafted ? "*" : ""),x,y);
  if (impactsData.isValueAddedCrafted)
  {
    y+=6;
    doc.setFont("Calibri","italic");
    doc.text("*Les activités de l'entreprise sont déclarées artisanales / faisant appel à un savoir-faire reconnu",x,y);
    doc.setFont("Calibri","normal");
  }
  return y;
}