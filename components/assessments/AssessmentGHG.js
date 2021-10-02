import React from 'react';

import { InputNumber } from '../InputNumber';
import { InputText } from '../InputText';
import { getNewId, printValue } from '../../src/utils/Utils';

import nrgProducts from '../../lib/nrgProducts.json';

/* -------------------------------------------------------- */
/* -------------------- ASSESSMENT GHG -------------------- */
/* -------------------------------------------------------- */

/* [FR] Liste des postes d'émissions :
    - emissions directes de sources fixes [1]
    - emissions directes de sources mobiles [2]
    - emissions directes de procédés hors énergie [3]
    - emissions fugitives [4]
    - emissions de la biomasse (sols et forêts) [5]

   Each item in ghgDetails has the following properties :
    id: id of the source,
    label: name of the source
    idNRG: if of the matching item in nrg details
    fuelCode: code of the energetic product (cf. base nrgProducts)
    type: fossil/biomass (used for distinction between fossil and biomass products)
    assessmentItem : id of the assessment item (1 -> 5)
    consumption: consumption
    consumptionUnit: unit for the consumption value
    consumptionUncertainty: uncertainty for the consumption value
    ghgEmissions: greenhouse gas emissions (in kgCO2e)
    ghgEmissionsUncertainty: uncertainty for the emissions

   Modifications are saved only when validation button is pressed, otherwise it stay in the state
*/

export class AssessmentGHG extends React.Component {

  constructor(props) {
    super(props)
    this.state = 
    {
      // total ghg emissions & uncertainty
      greenhousesGazEmissions: props.impactsData.greenhousesGazEmissions,
      greenhousesGazEmissionsUncertainty: props.impactsData.greenhousesGazEmissionsUncertainty,
      // details (by products)
      ghgDetails: props.impactsData.ghgDetails,
      // adding new product
      itemNewProduct: ""
    }
  }

  render() 
  {
    const {greenhousesGazEmissions,greenhousesGazEmissionsUncertainty,ghgDetails} = this.state;
    const {itemNewProduct} = this.state;

    return (
      <div className="assessment">
        <div className="view-header">
          <button className="retour"onClick = {() => this.props.onGoBack()}>Retour</button>
          <button className="retour"onClick = {() => this.onSubmit()}>Valider</button>
        </div>

        <div className="group"><h3>Outil de mesure</h3>

          <table>
            <thead>
              <tr><td colSpan="5">Libellé</td><td colSpan="2">Valeur</td><td colSpan="2">Incertitude</td><td></td></tr>
            </thead>
            <tbody>
              
              <tr>
                <td colSpan="5">Emissions directes des sources fixes de combustion</td>
                <td className="short right">{printValue(getTotalByAssessmentItem(ghgDetails,"1"),0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(getUncertaintyByAssessmentItem(ghgDetails,"1"),0)}</td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_add.jpg" alt="add" 
                  onClick={() => this.addNewLine("1")}/></td>
              </tr>

              {Object.entries(ghgDetails)
                     .filter(([_,itemData]) => itemData.assessmentItem=="1")
                     .map(([itemId,itemData]) => 
                <tr key={itemId}>
                  <td className="sub">
                    <select value={itemData.fuelCode}
                            onChange={(event) => this.changeNrgProduct(itemId,event.target.value)}>
                      {Object.entries(nrgProducts)
                              //.filter(([key,data]) => data.subCategory=="Usage source fixe")
                              .map(([key,data]) => <option key={itemId+"_"+key} value={key}>{data.label}</option>)}
                    </select></td>
                  <td className="short right">
                    <InputNumber value={itemData.consumption} 
                                 onUpdate={(nextValue) => this.updateFuelConsumption.bind(this)(itemId,nextValue)}/></td>
                  <td>
                    <select onChange={(event) => this.changeNrgProductUnit(itemId,event.target.value)} 
                            value={itemData.consumptionUnit}>
                      {Object.entries(nrgProducts[itemData.fuelCode].units)
                             .map(([unit,_]) => <option key={unit} value={unit}>{unit}</option>)}
                    </select></td>
                  <td className="short right">
                    <InputNumber value={itemData.consumptionUncertainty} 
                                 onUpdate={(nextValue) => this.updateFuelConsumptionUncertainty.bind(this)(itemId,nextValue)}/></td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                  <td className="short right">{printValue(itemData.ghgEmissions,0)}</td>
                  <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                  <td className="short right">{printValue(itemData.ghgEmissionsUncertainty,0)}</td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                  <td className="column_icon"><img className="img" src="/resources/icon_delete.jpg" onClick={() => this.deleteItem(itemId)} alt="delete"/></td>
                </tr>
              )}

              {itemNewProduct=="1" &&
                <tr>
                  <td className="sub">
                    <select value="0"
                            onChange={(event) => this.addProduct("1",event.target.value)}>
                      <option key="none" value="none">---</option>
                      {Object.entries(nrgProducts)
                             //.filter(([_,data]) => data.subCategory=="Usage source fixe")
                             .map(([key,data]) => <option key={key} value={key}>{data.label}</option>)}
                    </select></td>
                </tr>
              }

              <tr>
                <td colSpan="5">Emissions directes des sources mobiles de combustion</td>
                <td className="short right">{printValue(getTotalByAssessmentItem(ghgDetails,"2"),0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(getUncertaintyByAssessmentItem(ghgDetails,"2"),0)}</td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_add.jpg" onClick={() => this.addNewLine("2")} alt="add"/></td>
              </tr>

              {Object.entries(ghgDetails)
                     .filter(([_,itemData]) => itemData.assessmentItem=="2")
                     .map(([itemId,itemData]) => 
                <tr key={itemId}>
                  <td className="sub">
                    <select value={itemData.fuelCode}
                            onChange={(event) => this.changeNrgProduct(itemId,event.target.value)}>
                      {Object.entries(nrgProducts)
                             //.filter(([key,data]) => data.subCategory=="Usage sources mobiles")
                             .map(([key,data]) => <option key={itemId+"_"+key} value={key}>{data.label}</option>)}
                    </select></td>
                  <td className="short right">
                    <InputNumber value={itemData.consumption} 
                                 onUpdate={(nextValue) => this.updateFuelConsumption.bind(this)(itemId,nextValue)}/></td>
                  <td>
                    <select value={itemData.consumptionUnit}
                            onChange={(event) => this.changeNrgProductUnit(itemId,event.target.value)}>
                      {Object.entries(nrgProducts[itemData.fuelCode].units)
                             .map(([unit,_]) => <option key={unit} value={unit}>{unit}</option>)}
                    </select></td>
                  <td className="short right">
                    <InputNumber value={itemData.consumptionUncertainty} 
                                 onUpdate={(nextValue) => this.updateFuelConsumptionUncertainty.bind(this)(itemId,nextValue)}/></td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                  <td className="short right">{printValue(itemData.ghgEmissions,0)}</td>
                  <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                  <td className="short right">{printValue(itemData.ghgEmissionsUncertainty,0)}</td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                  <td className="column_icon"><img className="img" src="/resources/icon_delete.jpg" onClick={() => this.deleteItem(itemId)} alt="delete"/></td>
                </tr>
              )}

            {itemNewProduct=="2" &&
              <tr>
                <td className="sub">
                  <select value="0"
                          onChange={(event) => this.addProduct("2",event.target.value)}>
                    <option key="none" value="none">---</option>
                    {Object.entries(nrgProducts)
                            //.filter(([key,data]) => data.subCategory=="Usage sources mobiles")
                            .map(([key,data]) => <option key={key} value={key}>{data.label}</option>)}
                  </select></td>
              </tr>}

              <tr>
                <td colSpan="5">Emissions directes des procédés (hors énergie)</td>
                <td className="short right">{printValue(getTotalByAssessmentItem(ghgDetails,"3"),0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(getUncertaintyByAssessmentItem(ghgDetails,"3"),0)}</td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_add.jpg" alt="add" 
                  onClick={() => this.addNewLine("3")}/></td>
              </tr>

            {Object.entries(ghgDetails)
                    .filter(([_,itemData]) => itemData.assessmentItem=="3")
                    .map(([itemId,itemData]) => 
              <tr key={itemId}>
                <td className="sub">
                  <InputText value={itemData.label}/></td>
                <td className="short right">
                  <InputNumber value={itemData.consumption} 
                                onUpdate={(nextValue) => this.updateFuelConsumption.bind(this)(itemId,nextValue)}/></td>
                <td>kgCO2e</td>
                <td className="short right">
                    <InputNumber value={itemData.consumptionUncertainty} 
                                 onUpdate={(nextValue) => this.updateFuelConsumptionUncertainty.bind(this)(itemId,nextValue)}/></td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="short right">{printValue(itemData.ghgEmissions,0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(itemData.ghgEmissionsUncertainty,0)}</td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_delete.jpg" onClick={() => this.deleteItem(itemId)} alt="delete"/></td>
              </tr>)}

            {itemNewProduct=="3" &&
            <tr>
              <td className="sub">
                <InputText value=""
                           onUpdate={(nextValue) => this.addProduct.bind(this)("3",nextValue)}/></td>
            </tr>}
              
              <tr>
                <td colSpan="5">Emissions directes fugitives</td>
                <td className="short right">{printValue(getTotalByAssessmentItem(ghgDetails,"4"),0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(getUncertaintyByAssessmentItem(ghgDetails,"4"),0)}</td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_add.jpg" alt="add" 
                  onClick={() => this.addNewLine("4")}/></td>
              </tr>

            {Object.entries(ghgDetails)
                    .filter(([_,itemData]) => itemData.assessmentItem=="4")
                    .map(([itemId,itemData]) => 
              <tr key={itemId}>
                <td className="sub">
                  <InputText value={itemData.label}/></td>
                <td className="short right">
                  <InputNumber value={itemData.consumption} 
                                onUpdate={(nextValue) => this.updateFuelConsumption.bind(this)(itemId,nextValue)}/></td>
                <td>kgCO2e</td>
                <td className="short right">
                    <InputNumber value={itemData.consumptionUncertainty} 
                                 onUpdate={(nextValue) => this.updateFuelConsumptionUncertainty.bind(this)(itemId,nextValue)}/></td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="short right">{printValue(itemData.ghgEmissions,0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(itemData.ghgEmissionsUncertainty,0)}</td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_delete.jpg" onClick={() => this.deleteItem(itemId)} alt="delete"/></td>
              </tr>)}

            {itemNewProduct=="4" &&
              <tr>
                <td className="sub">
                  <InputText value=""
                            onUpdate={(nextValue) => this.addProduct.bind(this)("4",nextValue)}/></td>
              </tr>}
              
              <tr>
                <td colSpan="5">Emissions issues de la biomasse (sols et forêts)</td>
                <td className="short right">{printValue(getTotalByAssessmentItem(ghgDetails,"5"),0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(getUncertaintyByAssessmentItem(ghgDetails,"5"),0)}</td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_add.jpg" alt="add" 
                  onClick={() => this.addNewLine("5")}/></td>
              </tr>

            {Object.entries(ghgDetails)
                    .filter(([_,itemData]) => itemData.assessmentItem=="5")
                    .map(([itemId,itemData]) => 
              <tr key={itemId}>
                <td className="sub">
                  <InputText value={itemData.label}/></td>
                <td className="short right">
                  <InputNumber value={itemData.consumption} 
                                onUpdate={(nextValue) => this.updateFuelConsumption.bind(this)(itemId,nextValue)}/></td>
                <td>kgCO2e</td>
                <td className="short right">
                    <InputNumber value={itemData.consumptionUncertainty} 
                                 onUpdate={(nextValue) => this.updateFuelConsumptionUncertainty.bind(this)(itemId,nextValue)}/></td>
                <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="short right">{printValue(itemData.ghgEmissions,0)}</td>
                <td className="column_unit"><span>&nbsp;kgCO2e</span></td>
                <td className="short right">{printValue(itemData.ghgEmissionsUncertainty,0)}</td>
                  <td className="column_unit"><span>&nbsp;%</span></td>
                <td className="column_icon"><img className="img" src="/resources/icon_delete.jpg" onClick={() => this.deleteItem(itemId)} alt="delete"/></td>
              </tr>)}

            {itemNewProduct=="5" &&
              <tr>
                <td className="sub">
                  <InputText value=""
                              onUpdate={(nextValue) => this.addProduct.bind(this)("5",nextValue)}/></td>
              </tr>}

              <tr className="with-top-line">
                <td colSpan="5">Total</td>
                <td className="column_value">{printValue(greenhousesGazEmissions,0)}</td>
                <td className="column_unit">&nbsp;kgCO2e</td>
                <td className="column_value">{printValue(greenhousesGazEmissionsUncertainty,0)}</td>
                <td className="column_unit">&nbsp;%</td></tr>

            </tbody>
          </table>
        </div>
      </div>
    ) 
  }

  /* ----- NEW ITEM ----- */

  // New line
  addNewLine = (type) => this.setState({itemNewProduct: type})

  // set nrg product
  addProduct = (assessmentItem,source) => 
  {
    let ghgDetails = this.props.impactsData.ghgDetails;
    const id = getNewId(Object.entries(ghgDetails).map(([id,item]) => item));
    ghgDetails[id] = {
      id: id,
      label: source,
      fuelCode: source, 
      consumption: 0.0, 
      consumptionUnit: ["1","2"].includes(assessmentItem) ? "GJ" : "kgCO2e", 
      consumptionUncertainty: 0.0,
      ghgEmissions: 0.0,
      ghgEmissionsUncertainty: 0.0, 
      assessmentItem: assessmentItem
    }
    this.setState({ghgDetails: ghgDetails, itemNewProduct: ""});
  }

  /* ----- UPDATES ----- */

  // update nrg product (items 1 and 2)
  changeNrgProduct = (itemId,nextFuelCode) =>
  {
    let itemData = this.props.impactsData.ghgDetails[itemId];
    itemData.fuelCode = nextFuelCode;

    // check if the unit used is also available for the new product
    if (Object.keys(nrgProducts[nextFuelCode].units)
              .includes(itemData.consumptionUnit)) {
      itemData.ghgEmissions = getGhgEmissions(itemData);
    } 
    // else re-init values
    else {
      itemData = {...itemData, consumption: 0.0, ghgEmissions: 0.0, consumptionUnit: "GJ", uncertainty: 25.0}
    }
    this.updateGhgEmissions();
  }

  // update nrg product unit (items 1 and 2)
  changeNrgProductUnit = (itemId,nextConsumptionUnit) => 
  {
    let itemData = this.props.impactsData.ghgDetails[itemId];
    itemData.consumptionUnit = nextConsumptionUnit;
    itemData.ghgEmissions = getGhgEmissions(itemData);
    this.updateGhgEmissions();
  }
  
  // update label source (items 3, 4 and 5)
  updateLabel = (itemId,nextValue) => 
  {
    let item = this.props.impactsData.ghgDetails[itemId];
    item.label = nextValue;
  }

  // update fuel consumption or ghg emissions
  updateFuelConsumption = (itemId,nextValue) => 
  {
    let item = this.props.impactsData.ghgDetails[itemId];
    item.consumption = nextValue;
    if (!item.consumption) item.consumptionUncertainty = 0
    else if (!item.consumptionUncertainty) item.consumptionUncertainty = 25.0;
    item.ghgEmissions = getGhgEmissions(item);
    item.ghgEmissionsUncertainty = getGhgEmissionsUncertainty(item);
    this.updateGhgEmissions();
  }

  // update uncertainty
  updateFuelConsumptionUncertainty = (itemId,nextValue) =>
  {
    let item = this.props.impactsData.ghgDetails[itemId];
    item.consumptionUncertainty = nextValue;
    item.ghgEmissionsUncertainty = getGhgEmissionsUncertainty(item);
    this.updateGhgEmissions();
  }

  /* ----- DELETE ----- */

  deleteItem = (itemId) =>
  {
    delete this.props.impactsData.ghgDetails[itemId];
    this.updateGhgEmissions();
  }

  /* ---------- STATE / PROPS ---------- */

  // update state
  updateGhgEmissions = async () =>
  { 
    this.setState({
      greenhousesGazEmissions: getTotalGhgEmissions(this.state.ghgDetails), 
      greenhousesGazEmissionsUncertainty: getTotalGhgEmissionsUncertainty(this.state.ghgDetails)
    })
  }

  // update props
  onSubmit = async () =>
  {
    let impactsData = this.props.impactsData;

    // update ghg data
    impactsData.ghgDetails = this.state.ghgDetails;
    impactsData.greenhousesGazEmissions = this.state.greenhousesGazEmissions;
    impactsData.greenhousesGazEmissionsUncertainty = this.state.greenhousesGazEmissionsUncertainty;
    
    await this.props.onUpdate("ghg");

    // update nrg data
    // ...details
    Object.entries(impactsData.ghgDetails)
          .filter(([id,data]) => data.fuelCode!=undefined)
          .filter(([_,itemData]) => ["1","2"].includes(itemData.assessmentItem))
          .forEach(([itemId,itemData]) => 
          {
            if (itemData.idNRG==undefined) {
              const id = getNewId(Object.entries(impactsData.nrgDetails)
                                        .map(([id,data]) => data));
              impactsData.nrgDetails[id] = {
                id: id,
                idGHG: itemId,
                fuelCode: itemData.fuelCode,
                consumption: itemData.consumption, 
                consumptionUnit: itemData.consumptionUnit,
                uncertainty: itemData.uncertainty, 
                nrgConsumption: getNrgConsumption(itemData),
                type: nrgProducts[itemData.fuelCode].type
              }
            } else {
              impactsData.nrgDetails[itemData.idNRG].fuelCode = itemData.fuelCode;
              impactsData.nrgDetails[itemData.idNRG].consumption = itemData.consumption;
              impactsData.nrgDetails[itemData.idNRG].consumptionUnit = itemData.consumptionUnit;
              impactsData.nrgDetails[itemData.idNRG].uncertainty = itemData.uncertainty;
              impactsData.nrgDetails[itemData.idNRG].nrgConsumption = getNrgConsumption(itemData);
            }
          })
    // ...total & uncertainty
    impactsData.energyConsumption = Object.entries(impactsData.nrgDetails)
                                          .map(([key,data]) => data.nrgConsumption)
                                          .reduce((a,b) => a + b,0);
    
    await this.props.onUpdate("nrg");
  }
}

/* ---------- GHG FORMULAS ---------- */

const getGhgEmissions = ({consumption,consumptionUnit,fuelCode}) =>
{
  switch(consumptionUnit) {
    case "kgCO2e":  return consumption;
    case "tCO2e":   return consumption * 1000;
    default:        return consumption * nrgProducts[fuelCode].units[consumptionUnit].coefGHG;
  }
}

const getGhgEmissionsUncertainty = ({consumption,consumptionUnit,consumptionUncertainty,fuelCode}) =>
{
  const value = getGhgEmissions({consumption,consumptionUnit,fuelCode});
  const valueMax = getGhgEmissions({consumption: consumption*(1+consumptionUncertainty/100),consumptionUnit,fuelCode});
  const valueMin = getGhgEmissions({consumption: consumption*Math.max(1-consumptionUncertainty/100,0),consumptionUnit,fuelCode})
  return Math.round(Math.max(valueMax-value,value-valueMin)/value *100);
}

const getTotalGhgEmissions = (ghgDetails) =>
{
  const sum = Object.entries(ghgDetails)
                    .map(([_,data]) => data.ghgEmissions)
                    .reduce((a,b) => a + b,0);
  return sum;
}

const getTotalGhgEmissionsUncertainty = (ghgDetails) =>
{
  const items = Object.entries(ghgDetails).map(([_,itemData]) => itemData);
  if (items.length > 0)
  {
    const value = items.map((item) => item.ghgEmissions).reduce((a,b) => a + b,0);
    if (value > 0) {
      const valueMax = items.map((item) => item.ghgEmissions*(1+item.ghgEmissionsUncertainty/100)).reduce((a,b) => a + b,0);
      const valueMin = items.map((item) => item.ghgEmissions*Math.max(1-item.ghgEmissionsUncertainty/100,0)).reduce((a,b) => a + b,0);
      return Math.round(Math.max(valueMax-value,value-valueMin)/value *100);
    } else {
      return 0;
    }
  }
  else return  null;
}

const getTotalByAssessmentItem = (ghgDetails,assessmentItem) =>
  {
    const sum = Object.entries(ghgDetails).filter(([_,itemData]) => itemData.assessmentItem==assessmentItem).map(([_,itemData]) => itemData.ghgEmissions).reduce((a,b) => a + b,0);
    return sum;
  }

const getUncertaintyByAssessmentItem = (ghgDetails,assessmentItem) =>
{
  const items = Object.entries(ghgDetails).filter(([_,itemData]) => itemData.assessmentItem==assessmentItem).map(([_,itemData]) => itemData);
  if (items.length > 0)
  {
    const value = items.map((item) => item.ghgEmissions).reduce((a,b) => a + b,0);
    if (value > 0) {
      const valueMax = items.map((item) => item.ghgEmissions*(1+item.ghgEmissionsUncertainty/100)).reduce((a,b) => a + b,0);
      const valueMin = items.map((item) => item.ghgEmissions*Math.max(1-item.ghgEmissionsUncertainty/100,0)).reduce((a,b) => a + b,0);
      return Math.round(Math.max(valueMax-value,value-valueMin)/value *100);
    } else {
      return 0;
    }
  }
  else return  null;
}

/* ---------- NRG FORMULAS ---------- */

const getNrgConsumption = ({consumption,consumptionUnit,fuelCode}) =>
{
  switch(consumptionUnit) 
  {
    case "MJ": return consumption;
    case "kWh": return consumption*3.6;
    default: {
      const coef = nrgProducts[fuelCode].units[consumptionUnit].coefNRG;
      return consumption * coef;
    }
  }
}