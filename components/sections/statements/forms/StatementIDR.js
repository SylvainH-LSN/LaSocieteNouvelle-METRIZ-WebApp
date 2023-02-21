// La Société Nouvelle

// React
import React from "react";
import { Alert, Form } from "react-bootstrap";

// Utils
import {
  printValue,
  roundValue,
  valueOrDefault,
} from "../../../../src/utils/Utils";
import { InputNumber } from "../../../input/InputNumber";

/* ---------- DECLARATION - INDIC #IDR ---------- */
export class StatementIDR extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      interdecileRange: valueOrDefault(props.impactsData.interdecileRange, ""),
      info: props.impactsData.comments.idr || "",
      isDisabled: true,
      disableStatement: props.disableStatement,
    };
  }

  componentDidUpdate() {
    if (this.state.disableStatement != this.props.disableStatement) {
      this.setState({ disableStatement: this.props.disableStatement });
    }
    if (
      !this.props.impactsData.hasEmployees &&
      this.state.interdecileRange == 1
    ) {
      this.state.isDisabled = false;
    }
    if (
      this.props.impactsData.hasEmployees &&
      this.state.interdecileRange != "" &&
      this.props.impactsData.netValueAdded != null
    ) {
      this.state.isDisabled = false;
    }

    if (
      this.props.impactsData.hasEmployees &&
      this.state.interdecileRange == ""
    ) {
      this.state.isDisabled = true;
    }

    if (
      this.state.interdecileRange !=
      valueOrDefault(this.props.impactsData.interdecileRange, "")
    ) {
      this.setState({
        interdecileRange: valueOrDefault(
          this.props.impactsData.interdecileRange,
          ""
        ),
      });
    }
  }

  render() {
    const { hasEmployees } = this.props.impactsData;
    const { interdecileRange, info, isDisabled, disableStatement } = this.state;
    return (
      <div className="statement">
        {disableStatement && (
          <Alert variant="warning">
            <p>
              <i className="bi bi-exclamation-circle  me-2"></i>Indicateur
              indisponible lors de la précédente analyse
            </p>
          </Alert>
        )}
        <div className="statement-form">
          <div className="form-group">
            <label>L'entreprise est-elle employeur ?</label>

            <Form>
              <Form.Check
                inline
                type="radio"
                id="hasEmployees"
                label="Oui"
                value="true"
                checked={hasEmployees === true}
                onChange={this.onHasEmployeesChange}
                disabled={disableStatement}
              />
              <Form.Check
                inline
                type="radio"
                id="hasEmployees"
                label="Non"
                value="false"
                checked={hasEmployees === false}
                onChange={this.onHasEmployeesChange}
                disabled={disableStatement}
              />
            </Form>
          </div>
          <div className="form-group">
            <label>Rapport interdécile D9/D1 des taux horaires bruts</label>
            <InputNumber
              value={roundValue(interdecileRange, 1)}
              disabled={hasEmployees === false || disableStatement}
              onUpdate={this.updateInterdecileRange}
              placeholder=" "
              isInvalid={interdecileRange > 100 ? true : false}
            />
          </div>
        </div>
        <div className="statement-comments">
          <label>Informations complémentaires</label>
          <Form.Control
            as="textarea"
            rows={4}
            onChange={this.updateInfo}
            value={info}
            onBlur={this.saveInfo}
            disabled={disableStatement}
          />
        </div>
        <div className="statement-validation">
          <button
            className="btn btn-primary btn-sm"
            onClick={this.props.toImportDSN}
            disabled={hasEmployees && !disableStatement ? false : true}
          >
            <i className="bi bi-calculator"></i>
            &nbsp;Import Fichiers DSN
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={this.props.toAssessment}
            disabled={hasEmployees && !disableStatement ? false : true}
          >
            <i className="bi bi-calculator"></i>
            &nbsp;Outil d'évaluation
          </button>
          <button
            disabled={isDisabled || disableStatement}
            className="btn btn-secondary btn-sm"
            onClick={this.onValidate}
          >
            Valider
          </button>
        </div>
      </div>
    );
  }

  onHasEmployeesChange = (event) => {
    let radioValue = event.target.value;
    switch (radioValue) {
      case "true":
        this.props.impactsData.setHasEmployees(true);
        this.props.impactsData.wageGap = null;
        break;
      case "false":
        this.props.impactsData.setHasEmployees(false);
        this.props.impactsData.wageGap = 0;
        this.state.isDisabled = false;
        break;
    }
    this.setState({
      interdecileRange: valueOrDefault(
        this.props.impactsData.interdecileRange,
        ""
      ),
    });
    this.props.onUpdate("idr");
    this.props.onUpdate("geq");
  };

  updateInterdecileRange = (input) => {
    this.props.impactsData.interdecileRange = input;
    this.setState({
      interdecileRange: this.props.impactsData.interdecileRange,
      isDisabled: false,
    });
    this.props.onUpdate("idr");
  };

  updateInfo = (event) => this.setState({ info: event.target.value });
  saveInfo = () => (this.props.impactsData.comments.idr = this.state.info);

  onValidate = () => this.props.onValidate();
}
