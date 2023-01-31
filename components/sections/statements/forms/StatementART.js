// La Société Nouvelle

// React
import React from "react";
import { Form } from "react-bootstrap";

// Utils
import {
  printValueInput,
  roundValue,
  valueOrDefault,
} from "../../../../src/utils/Utils";

import { InputNumber } from "../../../input/InputNumber";

/* ---------- DECLARATION - INDIC #ART ---------- */

/** Component in IndicatorMainTab
 *  Props :
 *    - impactsData
 *    - onUpdate -> update footprints, update table
 *    - onValidate -> update validations
 *    - toAssessment -> open assessment view (if defined)
 *  Behaviour :
 *    Edit directly impactsData (session) on inputs blur
 *    Redirect to assessment tool (if defined)
 *    Update footprints on validation
 *  State :
 *    inputs
 */

export class StatementART extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      craftedProduction: valueOrDefault(
        props.impactsData.craftedProduction,
        undefined
      ),
      info: props.impactsData.comments.art || "",
    };
  }

  componentDidUpdate() {

    if (
      this.state.craftedProduction != this.props.impactsData.craftedProduction
    ) {
      this.setState({
        craftedProduction: this.props.impactsData.craftedProduction,
      });
    }
  }

  render() {
    const { isValueAddedCrafted, netValueAdded } = this.props.impactsData;
    const { craftedProduction } = this.state;

    let isValid = netValueAdded != null && (craftedProduction >= 0 && craftedProduction <= netValueAdded);

    return (
      <div className="statement">
        <div className="statement-form">
          <div className="form-group">
            <label>L'entreprise est-elle une entreprise artisanale ?</label>
            <Form>
            
              <Form.Check
                inline
                type="radio"
                id="hasValueAdded"
                label="Oui"
                value="true"
                checked={isValueAddedCrafted === true}
                onChange={this.onIsValueAddedCraftedChange}
              />

              <Form.Check
                inline
                type="radio"
                id="hasValueAdded"
                label="Partiellement"
                value="null"
                checked={isValueAddedCrafted === null}
                onChange={this.onIsValueAddedCraftedChange}
              />
              <Form.Check
                inline
                type="radio"
                id="hasValueAdded"
                label="Non"
                value="false"
                checked={isValueAddedCrafted === false}
                onChange={this.onIsValueAddedCraftedChange} 
              />
            </Form>
          </div>
          <div className="form-group">
            <label>Part de la valeur ajoutée artisanale</label>
           
            <InputNumber
              value={roundValue(craftedProduction, 0)}
              onUpdate={this.updateCraftedProduction.bind(this)}
              disabled={isValueAddedCrafted != null}
              placeholder="&euro;"
              isInvalid={!isValid}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Informations complémentaires</label>
          <textarea type="text" spellCheck="false" className="form-control" onChange={this.updateInfo}/>
        </div>
        <div className="statement-action">
          <button
            disabled={!isValid}
            className="btn btn-secondary btn-sm"
            onClick={this.onValidate}
          >
            Valider
          </button>
        </div>
      </div>
    );
  }

  onIsValueAddedCraftedChange = (event) => {
    let radioValue = event.target.value;
    switch (radioValue) {
      case "true":
        this.props.impactsData.isValueAddedCrafted = true;
        this.props.impactsData.craftedProduction =
          this.props.impactsData.netValueAdded;
        break;
      case "null":
        this.props.impactsData.isValueAddedCrafted = null;
        this.props.impactsData.craftedProduction = null;
        break;
      case "false":
        this.props.impactsData.isValueAddedCrafted = false;
        this.props.impactsData.craftedProduction = 0;
        break;
    }
    this.setState({
      craftedProduction: this.props.impactsData.craftedProduction,
    });
    this.props.onUpdate("art");
  };

  updateCraftedProduction = (input) => {
    this.props.impactsData.craftedProduction = input;
    this.setState({
      craftedProduction: this.props.impactsData.craftedProduction,
    });
    this.props.onUpdate("art");
  };

  updateInfo = (event) => this.setState({ info: event.target.value });
  saveInfo = () => (this.props.impactsData.comments.art = this.state.info);

  onValidate = () => this.props.onValidate();
}

