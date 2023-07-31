// La Société Nouvelle

import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Modal, InputGroup } from "react-bootstrap";
import { roundValue, valueOrDefault } from "/src/utils/Utils";
import { AssessmentKNW } from "../modals/AssessmentKNW";

const StatementKNW = ({ impactsData, onUpdate, onError }) => {
  const [researchAndTrainingContribution, setResearchAndTrainingContribution] =
    useState(valueOrDefault(impactsData.researchAndTrainingContribution, ""));
  const [info, setInfo] = useState(impactsData.comments.knw || " ");
  const [showModal, setShowModal] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (
      researchAndTrainingContribution !=
        impactsData.researchAndTrainingContribution &&
      impactsData.researchAndTrainingContribution
    ) {
      setResearchAndTrainingContribution(
        impactsData.researchAndTrainingContribution
      );
  
    }
  }, [impactsData.researchAndTrainingContribution]);

  const updateResearchAndTrainingContribution = (input) => {
    let errorMessage = "";
    const inputValue = input.target.valueAsNumber;

    if (isNaN(inputValue)) {
      errorMessage = "Veuillez saisir un nombre valide.";
    } else if (impactsData.netValueAdded == null) {
      errorMessage = "La valeur ajoutée nette n'est pas définie.";
    } else if (inputValue >= impactsData.netValueAdded) {
      errorMessage =
        "La valeur saisie ne peut pas être supérieure à la valeur ajoutée nette.";
    }

    setIsInvalid(errorMessage !== "");
    onError("knw", errorMessage);

    impactsData.researchAndTrainingContribution = input.target.value;
    setResearchAndTrainingContribution(input.target.value);

    onUpdate("knw");
  };

  const updateInfo = (event) => {
    setInfo(event.target.value);
    impactsData.comments.knw = event.target.value;
  };

  return (
    <Form className="statement">
      <Row>
        <Col lg={7}>
          <Form.Group as={Row} className="form-group">
            <Form.Label column lg={7}>
              Valeur ajoutée nette dédiée à la recherche ou à la formation
            </Form.Label>
            <Col>
              <div className="d-flex justify-content-between">
                <InputGroup className="custom-input me-1">
                  <Form.Control
                    type="number"
                    value={roundValue(researchAndTrainingContribution, 0)}
                    inputMode="numeric"
                    onChange={updateResearchAndTrainingContribution}
                    isInvalid={isInvalid}
                  />
                  <InputGroup.Text>&euro;</InputGroup.Text>
                </InputGroup>
                <Button
                  variant="light-secondary"
                  onClick={() => setShowModal(true)}
                >
                  <i className="bi bi-calculator"></i>
                </Button>
              </div>
            </Col>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="form-group">
            <Form.Label className="col-form-label">
              Informations complémentaires
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="w-100"
              onChange={updateInfo}
              value={info}
            />
          </Form.Group>
        </Col>
      </Row>

      <Modal
        show={showModal}
        size="xl"
        centered
        onHide={() => setShowModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Outils de mesure pour l'indicateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AssessmentKNW
            impactsData={impactsData}
            onGoBack={() => setShowModal(false)}
            handleClose={() => setShowModal(false)}
            onUpdate={onUpdate}
          />
        </Modal.Body>
      </Modal>
    </Form>
  );
};

export default StatementKNW;
