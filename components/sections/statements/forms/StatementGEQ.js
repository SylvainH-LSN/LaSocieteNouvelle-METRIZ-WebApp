// La Société Nouvelle

import React, { useState, useEffect } from "react";
import { Form, Row, Col, Button, Modal, InputGroup } from "react-bootstrap";
import { roundValue, valueOrDefault } from "/src/utils/Utils";
import { ImportDSN } from "../modals/socialData/ImportDSN_b";
import { IndividualsData } from "../modals/socialData/IndividualsData";

const StatementGEQ = (props) => {
  const [wageGap, setWageGap] = useState(
    valueOrDefault(props.impactsData.wageGap, "")
  );
  const [info, setInfo] = useState(props.impactsData.comments.geq || "");
  const [isDisabled, setIsDisabled] = useState(false);
  const [showCalculatorModal, setShowCalulatorModal] = useState(false);
  const [showDSN, setShowDSN] = useState(false);

  const hasEmployees = props.impactsData.hasEmployees;

  useEffect(() => {
    if (props.impactsData.hasEmployees == false) {
      props.onUpdate("geq");
    }
  }, []);

  useEffect(() => {
    if (!props.impactsData.hasEmployees && wageGap === 0) {
      setIsDisabled(false);
    }
    if (
      props.impactsData.hasEmployees &&
      wageGap !== "" &&
      props.impactsData.netValueAdded !== null
    ) {
      setIsDisabled(false);
    }

    if (props.impactsData.hasEmployees && wageGap === "") {
      setIsDisabled(true);
    }

    if (wageGap !== valueOrDefault(props.impactsData.wageGap, "")) {
      setWageGap(valueOrDefault(props.impactsData.wageGap, ""));
      props.onUpdate("geq");
    }
  }, [
    props.impactsData.hasEmployees,
    props.impactsData.netValueAdded,
    props.impactsData.wageGap,
    wageGap,
  ]);

  const onHasEmployeesChange = (event) => {
    let radioValue = event.target.value;
    switch (radioValue) {
      case "true":
        props.impactsData.setHasEmployees(true);
        props.impactsData.wageGap = null;
        break;
      case "false":
        props.impactsData.setHasEmployees(false);
        props.impactsData.wageGap = 0;
        setIsDisabled(false);
        break;
    }
    setWageGap(valueOrDefault(props.impactsData.wageGap, ""));
    props.onUpdate("geq");
  };

  const updateWageGap = (input) => {
    props.impactsData.wageGap = input.target.value;
    setWageGap(props.impactsData.wageGap);
    setIsDisabled(false);
    props.onUpdate("geq");
  };

  const updateInfo = (event) => setInfo(event.target.value);
  const saveInfo = () => (props.impactsData.comments.geq = info);

  return (
    <Form className="statement">
      <Row>
        <Col lg={7}>
          <Form.Group as={Row} className="form-group align-items-center">
            <Form.Label column lg={7}>
              L'entreprise est-elle employeur ?
            </Form.Label>

            <Col className="text-end">
              <Form.Check
                inline
                type="radio"
                id="hasEmployees"
                label="Oui"
                value="true"
                checked={hasEmployees === true}
                onChange={onHasEmployeesChange}
              />
              <Form.Check
                inline
                type="radio"
                id="hasEmployees"
                label="Non"
                value="false"
                checked={hasEmployees === false}
                onChange={onHasEmployeesChange}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="form-group">
            <Form.Label column lg={7}>
              Ecart de rémunérations Femmes/Hommes{" "}
              <span className="d-block small">
                (en % du taux horaire brut moyen)
              </span>
            </Form.Label>
            <Col>
              <InputGroup>
                <Form.Control
                  type="number"
                  value={roundValue(wageGap, 1)}
                  disabled={hasEmployees === false}
                  inputMode="numeric"
                  onChange={updateWageGap}
                  isInvalid={isDisabled}
                />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
              <Button
                variant="light-secondary"
                className="btn-sm mt-1 me-2 rounded-2  w-100 p-1"
                onClick={() => setShowDSN(true)}
                disabled={hasEmployees ? false : true}
              >
                <i className="bi bi-upload me-1"></i>
                &nbsp;Importer les DSN
              </Button>

              <Button
                variant="light"
                className="btn-sm mt-1 me-2 rounded-2 w-100 p-1 fw-bold"
                onClick={() => setShowCalulatorModal(true)}
                disabled={
                  hasEmployees && props.impactsData.socialStatements.length > 0
                    ? false
                    : true
                }
              >
                <i className="bi bi-pencil me-1"></i>
                Gérer les données importées
              </Button>
            </Col>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="form-group">
            <Form.Label className="col-form-label">
              Informations complémentaires
            </Form.Label>{" "}
            <Col>
              <Form.Control
                as="textarea"
                rows={3}
                className="w-100"
                onChange={updateInfo}
                value={info}
                onBlur={saveInfo}
              />
            </Col>
          </Form.Group>
        </Col>
      </Row>

      <Modal
        show={showCalculatorModal}
        size="xl"
        centered
        onHide={() => setShowCalulatorModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Données sociales</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <IndividualsData
            impactsData={props.impactsData}
            onGoBack={() => setShowCalulatorModal(false)}
            handleClose={() => setShowCalulatorModal(false)}
            onUpdate={props.onUpdate}
          />
        </Modal.Body>
      </Modal>

      <Modal show={showDSN} size="xl" centered onHide={() => setShowDSN(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Données sociales</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ImportDSN
            impactsData={props.impactsData}
            onGoBack={() => setShowDSN(false)}
            handleClose={() => setShowDSN(false)}
            onUpdate={props.onUpdate}
          />
        </Modal.Body>
      </Modal>
    </Form>
  );
};

export default StatementGEQ;
