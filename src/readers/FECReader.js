/* ---------------------------------------------------- */
/* -------------------- FEC READER -------------------- */
/* ---------------------------------------------------- */

// Labels OR Codes
// ...to move to a separate file
const journalANouveauxLabels = ['A NOUVEAUX','A NOUVEAU']; 
const journalANouveauxCodes = ['AN','RAN','AA','AD'];

const journalAchatsLabels = ['ACHATS','BANQUE']; 
const journalAchatsCodes = ['HA'];

const journalVentesLabels = ['VENTES']; 
const journalVentesCodes = ['VT','VE'];

const journalDotationsLabels = []; 
const journalDotationsCodes = ['OD','ODA','INV'];

/* ---------- FILE READER ---------- */ 

async function FECFileReader(content)
// ...build JSON from FEC File
{
  let dataFEC = {};
  dataFEC.meta = {};
  dataFEC.meta.books = {};
  dataFEC.books = [];
  let columns = {};

  // read header
  // ...build mapping between labels and columns indexes
  const header = content.slice(0,content.indexOf('\n')).split("\t");
  header.forEach((column) => {
    columns[column] = header.indexOf(column);
  })

  // read rows
  const rows = content.slice(content.indexOf('\n')+1).split('\n');
  await rows.forEach(async (rowString) => {
    if (rowString!="")
    {
      // split row
      let row = rowString.split("\t");
      
      // read row
      let rowData = await readFECFileRow(columns,row);

      // update meta books
      if (dataFEC.meta.books[rowData.JournalCode]==undefined) 
      {
        dataFEC.meta.books[rowData.JournalCode] = rowData.JournalLib;
        dataFEC.books[rowData.JournalCode] = [];
      }

      // push
      dataFEC.books[rowData.JournalCode].push(rowData);
    }
  })
  
  return dataFEC;
}

// Read line
// ...build JSON from the row with labels as keys
async function readFECFileRow(columns,row) {
  let rowData = {}
  Object.entries(columns).forEach(([column,index]) => {
    rowData[column] = row[index].replace(/^\"/,"")      // remove quote at the beginning
                                .replace(/\"$/,"")      // remove quote at the end
                                .replace(/ *$/,"");     // remove spaces at the end
  })
  return rowData;
}


/* ---------- FEC DATA PROCESSER ---------- */ 

async function processFECData(FECData)
// ...extract data to use in session
{
  //console.log(FECData);
  let data = {};

  data.revenue = 0;
  data.stockInitProduction = 0;
  data.unstoredProduction = 0;
  data.storedProduction = 0;
  data.immobilisedProduction = 0;

  data.expenses = [];
  data.initialStocks = [];
  data.stocksVariations = [];
  data.purchasesDiscounts = [];
  
  data.investments = [];
  data.depreciations = [];
  data.immobilisations = [];
  data.depreciationsInit = [];
  data.accounts = {};

  // scan each book
  await Object.entries(FECData.meta.books).forEach(([bookCode,bookLib]) => 
 {  
    // ~ A Nouveaux
    if (journalANouveauxCodes.includes(bookCode) || journalANouveauxLabels.includes(bookLib.toUpperCase())) { 
      readBookAsJournalANouveaux(data, FECData.books[bookCode])
    }

    else 
    {
      // ~ Ventes
      //if (journalVentesCodes.includes(bookCode) || journalVentesLabels.includes(bookLib.toUpperCase())) { 
        readBookAsJournalVentes(data, FECData.books[bookCode]);
      //}
  
      // ~ Achats
      //if (journalAchatsCodes.includes(bookCode) || journalAchatsLabels.includes(bookLib.toUpperCase())) { 
        readBookAsJournalAchats(data, FECData.books[bookCode]);
      //}
  
      // ~ Operations Diverses
      //if (journalDotationsCodes.includes(bookCode) || journalDotationsLabels.includes(bookLib.toUpperCase())) { 
        readBookAsJournalOperationsDiverses(data, FECData.books[bookCode]);
      //}
    }

  })

  return data;
}

/* ----- BOOKS READERS ----- */

// A Nouveaux
async function readBookAsJournalANouveaux(data,book) 
{  
  await book.forEach((ecriture) => {

    // Stock Production
    if (ecriture.CompteNum.substring(0,2)=="33"
          || ecriture.CompteNum.substring(0,2)=="34"
          || ecriture.CompteNum.substring(0,2)=="35") {
      data.stockInitProduction+= parseAmount(ecriture.Debit);
    }

    // Stock Purchases
    if (ecriture.CompteNum.substring(0,2)=="31"
          || ecriture.CompteNum.substring(0,2)=="32"
          || ecriture.CompteNum.substring(0,2)=="37") {
      let initialStockData = {
        account: ecriture.CompteNum,
        label: ecriture.CompteLib,
        amount: parseAmount(ecriture.Debit)
      }
      data.initialStocks.push(initialStockData);
    }

    // Immobilisations
    if (ecriture.CompteNum.substring(0,2)=="20"
          || ecriture.CompteNum.substring(0,2)=="21") {
      let immobilisationData = {
        account: ecriture.CompteNum,
        label: ecriture.CompteLib,
        amount: parseAmount(ecriture.Debit)
      }
      data.immobilisations.push(immobilisationData);
    }

    // Amortissements
    if (ecriture.CompteNum.substring(0,2)=="28") {
      let depreciationData = {
        account: ecriture.CompteNum,
        amount: parseAmount(ecriture.Credit)
      }
      data.depreciationsInit.push(depreciationData);
    }
  })
}

// Ventes
async function readBookAsJournalVentes(data,book) 
{  
  await book.forEach((ecriture) => {

    // Revenus
    if (ecriture.CompteNum.substring(0,2)=="70" && ecriture.CompteNum.substring(0,3)!="709") {
      data.revenue+= parseAmount(ecriture.Credit);
    } else if (ecriture.CompteNum.substring(0,3)=="709") {
      data.revenue-= parseAmount(ecriture.Debit);
    }
  })
}

// Achats
async function readBookAsJournalAchats(data,book) 
{  
  await book.forEach((ecriture) => {

    // Charges externes
    if ((ecriture.CompteNum.substring(0,2)=="60" && ecriture.CompteNum.substring(0,3)!="603")
          || ecriture.CompteNum.substring(0,2)=="61"
          || ecriture.CompteNum.substring(0,2)=="62") 
    { 
      if (data.accounts[ecriture.CompteNum]==undefined) data.accounts[ecriture.CompteNum] = ecriture.CompteLib;

      let ecritureAux = book.filter(ecritureAux => ecritureAux.EcritureNum==ecriture.EcritureNum & ecritureAux.CompteNum.substring(0,2)=="40")[0] || "";
      if (data.accounts[ecritureAux.CompAuxNum]==undefined) data.accounts[ecritureAux.CompAuxNum] = (ecritureAux.CompAuxLib || "").replace(/ *$/,"").replace(/^\"/,"").replace(/\"$/,"");
      
      let expenseData = {
        label: ecriture.EcritureLib.replace(/^\"/,"").replace(/\"$/,""),
        account: ecriture.CompteNum,
        accountProvider: ecritureAux.CompAuxNum,
        amount: parseAmount(ecriture.Debit),
      }
      data.expenses.push(expenseData);
    }

    // Rabais, remises, ristournes
    if (ecriture.CompteNum.substring(0,3)=="609") 
    {
      if (data.accounts[ecriture.CompteNum]==undefined) data.accounts[ecriture.CompteNum] = ecriture.CompteLib;

      let ecritureAux = book.filter(ecritureAux => ecritureAux.EcritureNum==ecriture.EcritureNum & ecritureAux.CompteNum.substring(0,2)=="40")[0] || "";
      if (data.accounts[ecritureAux.CompAuxNum]==undefined) data.accounts[ecritureAux.CompAuxNum] = (ecritureAux.CompAuxLib || "").replace(/ *$/,"").replace(/^\"/,"").replace(/\"$/,"");

      let expenseData = {
        label: ecriture.EcritureLib.replace(/^\"/,"").replace(/\"$/,""),
        account: ecriture.CompteNum,
        accountProvider: ecritureAux.CompAuxNum,
        amount: parseAmount(ecriture.Credit),
      }
      data.purchasesDiscounts.push(expenseData);
    }

    // Investissements
    if (ecriture.CompteNum.substring(0,2)=="20"
          || ecriture.CompteNum.substring(0,2)=="21")
    {
      if (data.accounts[ecriture.CompteNum]==undefined) data.accounts[ecriture.CompteNum] = ecriture.CompteLib;

      let ecritureAux = book.filter(ecritureAux => ecritureAux.EcritureNum==ecriture.EcritureNum & ecritureAux.CompteNum.substring(0,2)=="40")[0];
      if (data.accounts[ecritureAux.CompAuxNum]==undefined) data.accounts[ecritureAux.CompAuxNum] = (ecritureAux.CompAuxLib || "").replace(/ *$/,"").replace(/^\"/,"").replace(/\"$/,"");

      let investmentData = {
        label: ecriture.EcritureLib.replace(/^\"/,"").replace(/\"$/,""),
        account: ecriture.CompteNum,
        accountProvider: ecritureAux.CompAuxNum,
        amount: parseAmount(ecriture.Debit),
      }
      data.investments.push(investmentData);
    }
  })
}

// Operations diverses & Inventaires
async function readBookAsJournalOperationsDiverses(data,book) 
{  
  await book.forEach((ecriture) => {
    
    // Stored/Unstored Production
    if (ecriture.CompteNum.substring(0,2)=="71") {
      data.storedProduction+= parseAmount(ecriture.Credit);
      data.unstoredProduction+= parseAmount(ecriture.Debit);
    }

    // Immobilised Production
    if (ecriture.CompteNum.substring(0,2)=="72") {
      data.immobilisedProduction+= parseAmount(ecriture.Credit);
    }
    
    // Stored/Unstored Purchases
    if (ecriture.CompteNum.substring(0,2)=="31"
        || ecriture.CompteNum.substring(0,2)=="32"
        || ecriture.CompteNum.substring(0,2)=="37") 
    {      
      if (data.accounts[ecriture.CompteNum]==undefined) data.accounts[ecriture.CompteNum] = (ecriture.CompteLib || "").replace(/ *$/,"").replace(/^\"/,"").replace(/\"$/,"");

      let stockAccount = data.stocksVariations.filter(stock => stock.account == ecriture.CompteNum)[0];
      if (stockAccount!=undefined) {
        stockAccount.amount+= parseAmount(ecriture.Debit)-parseAmount(ecriture.Credit);
      } else {
        let stockAccount = {
          label: ecriture.CompteLib.replace(/^\"/,"").replace(/\"$/,""),
          account: ecriture.CompteNum,
          amount: parseAmount(ecriture.Debit)-parseAmount(ecriture.Credit),
        }
        data.stocksVariations.push(stockAccount);
      }
    }

    // Dotations amortissements
    if (ecriture.CompteNum.substring(0,2)=="28") 
    {
      let depreciation = data.depreciations.filter(depreciation => depreciation.account == ecriture.CompteNum)[0];
      if (depreciation != undefined) {
        depreciation.amount+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);
      } else {
        let depreciationData = {
          label: ecriture.CompteLib.replace(/^\"/,"").replace(/\"$/,""),
          account: ecriture.CompteNum,
          amount: parseAmount(ecriture.Credit)+parseAmount(ecriture.Debit),
        }
        data.depreciations.push(depreciationData);
      }
    }
  })
}

function parseAmount(stringAmount) {
  return parseFloat(stringAmount.replace(',','.'))
}

export {FECFileReader, processFECData};