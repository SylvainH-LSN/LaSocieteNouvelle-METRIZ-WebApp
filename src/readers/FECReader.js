// La Société Nouvelle - METRIZ

// Libraries
import booksProps from '../../lib/books.json'

/* ---------------------------------------------------- */
/* -------------------- FEC READER -------------------- */
/* ---------------------------------------------------- */

/*  This reader is divided into 2 methods:
 *    - FECFileReader to read the file and parse it to JSON
 *        Encoding has to be ISO-8859-1 [as normally required]
 *        Separator must be '\t' (tabulation) or '|' (pipe) [as normally required]
 *        Structure of the JSON :
 *          .books (Array) -> books with the entries ({bookCode : [...entries]})
 *          .meta -> books labels, accounts labels, accountsAux labels ({code: label})
 *    - FECDataReader to read the data and build a JSON to load into FinancialData object
 * 
 *  A documentation of the reading is available at https://github.com/SylvainH-LSN/LaSocieteNouvelle-METRIZ-WebApp/blob/main/src/readers/DOCUMENTATION%20-%20FEC%20Reader.md
 */

// EXPORT
export { FECFileReader, FECDataReader };

/* -------------------- PARSER -------------------- */

const parseAmount = (stringAmount) => parseFloat(stringAmount.replace(',','.'))

/* -------------------- FILE READER -------------------- */ 

async function FECFileReader(content) 
// ...build JSON from FEC File (FEC -> JSON)
{
  /* --- OUTPUT --- */
  
  let dataFEC = {meta: {books: {},accounts: {}, accountsAux: {}}, books: []};

  /* --- SEPARATOR --- */

  let separator = content.slice(0,content.indexOf('\n')).split('\t').length == 18 ? '\t' : '|';

  /* --- HEADER --- */
  
  // read header & build columns index
  let indexColumns = {};
  const header = content.slice(0,content.indexOf('\n')).split(separator);
        header.forEach(column => indexColumns[column] = header.indexOf(column));

  /* --- ROWS --- */
  
  // array of rows
  const rows = content.slice(content.indexOf('\n')+1).split('\n');

  // read rows
  await rows.forEach(async (rowString) => 
  {
    // split & read row (String -> JSON)
    let rowArray = rowString.split(separator);

    if (rowArray.length == 18)
    {
      // build row data
      let rowData = await readFECFileRow(indexColumns,rowArray);

      // update meta books & books array
      if (!(rowData.JournalCode in dataFEC.meta.books)) {
        dataFEC.books[rowData.JournalCode] = [];
        dataFEC.meta.books[rowData.JournalCode] = {label: rowData.JournalLib, type: getDefaultBookType(rowData.JournalCode,rowData.JournalLib)}
      }
      // update meta accounts
      if (dataFEC.meta.accounts[rowData.CompteNum] == undefined) {
        dataFEC.meta.accounts[rowData.CompteNum] = rowData.CompteLib;
      }
      // update meta subsidiaries accounts
      if (rowData.CompAuxNum != undefined && dataFEC.meta.accountsAux[rowData.CompAuxNum] == undefined) {
        dataFEC.meta.accountsAux[rowData.CompAuxNum] = rowData.CompAuxLib;
      }

      // push data
      dataFEC.books[rowData.JournalCode].push(rowData);
    }
  })

  /* --- RETURN --- */

  return dataFEC;
}

// Read line (Array -> JSON)
async function readFECFileRow(indexColumns,rowArray) 
{
  let rowData = {}
  Object.entries(indexColumns).forEach(([column,index]) => 
  {
    rowData[column] = rowArray[index].replace(/^\"/,"")      // remove quote at the beginning
                                     .replace(/\"$/,"")      // remove quote at the end
                                     .replace(/ *$/,"");     // remove spaces at the end
  })
  return rowData;
}

// Book recognition
function getDefaultBookType(bookCode,bookLib) 
{
  // ~ A Nouveaux
  if (booksProps.ANOUVEAUX.codes.includes(bookCode) 
    || booksProps.ANOUVEAUX.labels.includes(bookLib.toUpperCase())) return "ANOUVEAUX";
  // ~ Ventes
  else if (booksProps.VENTES.codes.includes(bookCode) 
    || booksProps.VENTES.labels.includes(bookLib.toUpperCase())) return "VENTES"
  // ~ Achats
  else if (booksProps.ACHATS.codes.includes(bookCode) 
    || booksProps.ACHATS.labels.includes(bookLib.toUpperCase())) return "ACHATS"
  // ~ Operations Diverses
  else if (booksProps.OPERATIONS.codes.includes(bookCode) 
    || booksProps.OPERATIONS.labels.includes(bookLib.toUpperCase())) return "OPERATIONS"
  // ~ Others
  else return "AUTRE";
}


/* -------------------- DATA READER -------------------- */ 

async function FECDataReader(FECData)
// ...extract data to use in session (JSON -> Session)
{ 
  /* --- OUTPUT --- */
  
  let data = {};

  // Meta ----------------------------------------------------------------------------------------------- //
  data.accounts = FECData.meta.accounts;
  data.accountsAux = FECData.meta.accountsAux;

  // Production / Incomes ------------------------------------------------------------------------------- //
  data.revenue = 0;                 // 70
  data.storedProduction = 0;        // 71 + prevAmount 33, 34 & 35
  data.immobilisedProduction = 0;   // 72
  data.unstoredProduction = 0;      // prevAmount 33, 34 & 35
  data.otherOperatingIncomes = 0;   // 74, 75, 781, 791

  // Stocks --------------------------------------------------------------------------------------------- //
  data.stocks = [];                 // stock 31, 32, 33, 34, 35, 37
  data.stocksVariations = [];       // stock flow 603, 71 <-> 31, 32, 33, 34, 35, 37

  // Expenses ------------------------------------------------------------------------------------------- //
  data.expenses = [];               // 60, 61, 62 (hors 603) (609 read as negative expenses)
  
  // Immobilisations ------------------------------------------------------------------------------------ //
  data.immobilisations = [];        // stock 20, 21
  data.investments = [];            // flow 404 -> 20, 21
  data.depreciations = [];          // flow 6811 -> 28 (i.e 20, 21)

  // others key figures --------------------------------------------------------------------------------- //
  data.taxes = 0;                   // flow <- 63_
  data.personnelExpenses = 0;       // flow <- 64_
  data.otherExpenses = 0;           // flow <- 65_
  data.financialExpenses = 0;       // flow <- 66_
  data.exceptionalExpenses = 0;     // flow <- 67_
  data.provisions = 0;              // flow <- 68_ (hors 6811)
  data.taxOnProfits = 0;            // flow <- 69_

  // Other used data ------------------------------------------------------------------------------------//
  data.KNWData = {apprenticeshipTax: 0, vocationalTrainingTax: 0}

  /* --- A NOUVEAUX --- */

  // Get book code for "A Nouveaux"
  let codeANouveaux = Object.entries(FECData.meta.books)
                            .filter(([_,{type}]) => type == "ANOUVEAUX")
                            .map(([bookCode,_]) => bookCode)[0];

  if (codeANouveaux != undefined) await readBookAsJournalANouveaux(data, FECData.books[codeANouveaux]);

  /* --- OTHER BOOKS --- */

  await Object.entries(FECData.meta.books)
              .filter(([_,{type}]) => type != "ANOUVEAUX")
              .forEach(async ([bookCode,_]) => 
 {  
    // Get book
    let book = FECData.books[bookCode];

    // Read book
    await book.forEach((ecriture) => 
    {
      // Read entry for financial data
      if (ecriture.CompteNum.charAt(0) == "2") readImmobilisationEntry(data,book,ecriture);
      if (ecriture.CompteNum.charAt(0) == "3") readStockEntry(data,book,ecriture);      
      if (ecriture.CompteNum.charAt(0) == "6") readExpenseEntry(data,book,ecriture);
      if (ecriture.CompteNum.charAt(0) == "7") readProductionEntry(data,book,ecriture);
      
      // Read entry for additional data
      if (ecriture.CompteNum.substring(0,2) == "63") readAddtionalDataEntry(data,book,ecriture);
    })

  })

  /* --- RETURN --- */

  return data;
}

/* -------------------- BOOKS READERS ------------------------- */

/* ---------- JOURNAL A NOUVEAUX ---------- */

async function readBookAsJournalANouveaux(data,book) 
{  
  await book.sort((a,b) => a.CompteNum.localeCompare(b.CompteNum))
            .forEach((ecriture) => 
  {
    
    /* --- IMMOBILISATIONS --- */

    /*  LISTE DES COMPTES D'IMMOBILISATIONS - NIV 1
    ----------------------------------------------------------------------------------------------------
      Comptes 20 - Immobilisations incorporelles
      Comptes 21 - Immobilisations corporelles
      Comptes 22 - Immobilisations mises en concession
      Comptes 23 - Immobilisations en cours
      Comptes 25 - Part dans des entreprises liées
      Comptes 26 - Participations
      Comptes 27 - Autres immobilisations financières
      Comptes 28 - Amortissements des immobilisations (non enregistrés) -> valeur comptable
      Comptes 29 - Dépréciations des immobilisations (non enregistrés)
    ----------------------------------------------------------------------------------------------------
     */

    // Comptes d'immobilisations (hors amortissements et dépréciations) --------------------------------- //
    if (ecriture.CompteNum.charAt(0)=="2" && !["28","29"].includes(ecriture.CompteNum))
    {
      // amortissement pour les immobilisations amortissables
      let valueLoss = 0;
      let isDepreciableImmobilisation = ["20","21"].includes(ecriture.CompteNum.substring(0,2));
      if (isDepreciableImmobilisation)
      {
        let accountAmortisation = "28"+ecriture.CompteNum.slice(1,-1);
        let ecritureAmortisation = book.filter(ecritureAmortisation => ecritureAmortisation.CompteNum == accountAmortisation)[0];
        valueLoss = ecritureAmortisation ? parseAmount(ecritureAmortisation.Credit) : 0;
      }

      // immobilisation data
      let immobilisationData = 
      {
        account: ecriture.CompteNum,
        accountLib: ecriture.CompteLib,
        isDepreciableImmobilisation: true,
        prevAmount: parseAmount(ecriture.Debit) - valueLoss,
        amount: parseAmount(ecriture.Debit) - valueLoss
      }

      // push data
      data.immobilisations.push(immobilisationData);
    }


    /* --- STOCKS --- */

    /*  LISTE DES COMPTES DE STOCKS - NIV 1
    ----------------------------------------------------------------------------------------------------
      Comptes 31 - Matières premières
      Comptes 32 - Autres approvisionnements
      Comptes 33 - En-cours de production de biens [Production]
      Comptes 34 - En-cours de production de services [Production]
      Comptes 35 - Stocks de produits [Production]
      Comptes 36 - Stocks provenant d'immobilisation (non traités)
      Comptes 37 - Stocks de marchandises
      Comptes 38 - Stocks en voie d'acheminement (non traités)
      Comptes 39 - Dépréciations des stocks et en-cours (non traités)
    ----------------------------------------------------------------------------------------------------
     */
    
    // Comptes de stocks (hors dépréciations et comptes 36 & 38) ---------------------------------------- //
    if (ecriture.CompteNum.charAt(0)=="3" && !["36","38","39"].includes(ecriture.CompteNum.substring(0,2)))
    {
      let isProductionStock = ["33","34","35"].includes(ecriture.CompteNum.substring(0,2));
      // Unstored production aggregate
      data.unstoredProduction+= isProductionStock ? parseAmount(ecriture.Debit) : 0;
      // stock data
      let stockData = 
      {
        account: ecriture.CompteNum,
        isProductionStock: isProductionStock,
        accountAux: isProductionStock ? undefined : "60"+ecriture.CompteNum.slice(1,-1).replaceAll("0$",""),
        accountLib: ecriture.CompteLib,
        amount: parseAmount(ecriture.Debit),
        prevAmount: parseAmount(ecriture.Debit)
      }
      // push data
      data.stocks.push(stockData);
    }

  })
}

/* -------------------- ENTRIES READERS ------------------------- */

/* ---------- COMPTES D'IMMOBILISATIONS ---------- */

const readImmobilisationEntry = async (data,book,ecriture) =>
{
  /*  LISTE DES COMPTES D'IMMOBILISATIONS - NIV 1
  ----------------------------------------------------------------------------------------------------
    Comptes 20 - Immobilisations incorporelles
    Comptes 21 - Immobilisations corporelles
    Comptes 22 - Immobilisations mises en concession
    Comptes 23 - Immobilisations en cours
    Comptes 25 - Part dans des entreprises liées
    Comptes 26 - Participations
    Comptes 27 - Autres immobilisations financières
    Comptes 28 - Amortissements des immobilisations
    Comptes 29 - Dépréciations des immobilisations (non traités)
  ----------------------------------------------------------------------------------------------------
  */

  // Immobilisation ----------------------------------------------------------------------------------- //
  if (["20","21","23","25","26","27"].includes(ecriture.CompteNum.substring(0,2)))
  {
    // Retrieve immobilisation item
    let immobilisation = data.immobilisations.filter(immobilisation => immobilisation.account == ecriture.CompteNum)[0];
    
    // variation de la valeur de l'immobilisation
    immobilisation.amount+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);

    // lecture du compte auxiliaire (cas acquisition)
    let ecritureAux = book.filter(ecritureAux => ecritureAux.EcritureNum == ecriture.EcritureNum 
                                              && ecritureAux.CompteNum.substring(0,2) == "40")[0];
    if (ecritureAux != undefined)
    {      
      // investment data
      let investmentData = 
      {
        label: ecriture.EcritureLib.replace(/^\"/,"").replace(/\"$/,""),
        account: ecriture.CompteNum,
        accountLib: ecriture.CompteLib,
        accountAux: ecritureAux.CompAuxNum || ecritureAux.CompteNum,
        accountAuxLib : ecritureAux.CompAuxLib,
        amount: parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit),
      }

      // push data
      data.investments.push(investmentData);
    }
    
  }

  // Amortissement ------------------------------------------------------------------------------------ //
  if (ecriture.CompteNum.substring(0,2)=="28")
  {
    // variation de la valeur de l'immobilisation
    let accountImmobilisation = "2"+ecriture.CompteNum.substring(2)+"0";
    let immobilisation = data.immobilisations.filter(immobilisation => immobilisation.account == accountImmobilisation)[0];
    immobilisation.amount+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  }

}

/* ---------- COMPTES DE STOCKS ---------- */

const readStockEntry = async (data,book,ecriture) =>
{
  /*  LISTE DES COMPTES DE STOCKS - NIV 1
  ----------------------------------------------------------------------------------------------------
    Comptes 31 - Matières premières
    Comptes 32 - Autres approvisionnements
    Comptes 33 - En-cours de production de biens [Production]
    Comptes 34 - En-cours de production de services [Production]
    Comptes 35 - Stocks de produits [Production]
    Comptes 36 - Stocks provenant d'immobilisation (non traités)
    Comptes 37 - Stocks de marchandises
    Comptes 38 - Stocks en voie d'acheminement (non traités)
    Comptes 39 - Dépréciations des stocks et en-cours (non traités)
  ----------------------------------------------------------------------------------------------------
  */
  
  // Stock -------------------------------------------------------------------------------------------- //
  if (["31","32","33","34","35","37"].includes(ecriture.CompteNum.substring(0,2)))
  {    
    // Retrieve stock item
    let stock = data.stocks.filter(stock => stock.account == ecriture.CompteNum)[0];
    
    // if stock already define
    if (stock != undefined) stock.amount+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);

    // if stock not defined
    else
    {
      // Type of stock
      let isProductionStock = ["33","34","35"].includes(ecriture.CompteNum.substring(0,2));
            
      // stock data
      let stockData = 
      {
        account: ecriture.CompteNum,
        accountLib: ecriture.CompteLib,
        isProductionStock: isProductionStock,
        accountAux: isProductionStock ? undefined : "60"+ecriture.CompteNum.slice(1,-1).replaceAll("0$",""),
        amount: parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit),
        prevAmount: 0
      }

      // push data
      data.stocks.push(stockData);
    }
  }
}

/* ---------- COMPTES DE CHARGES ---------- */

const readExpenseEntry = async (data,book,ecriture) =>
{
  /*  LISTE DES COMPTES DE CHARGES - NIV 1
  ----------------------------------------------------------------------------------------------------
    Comptes 60 - Achats (sauf 603, variation des stocks)
    Comptes 61 - Services extérieurs
    Comptes 62 - Autres services extérieurs
    Comptes 63 - Impôts, taxes et versements assimilés
    Comptes 64 - Charges de personnel
    Comptes 65 - Autres charges de gestion courante
    Comptes 66 - Charges financières
    Comptes 67 - Charges exceptionnelles
    Comptes 68 - Dotations aux amortissements, dépréciations et provisions
    Comptes 69 - Participation des salariés, impôts sur les bénéfices et assimilés
  ----------------------------------------------------------------------------------------------------
  */

  // Charges externes (60, 61, 62 hors 603) ----------------------------------------------------------- //
  if (["60","61","62"].includes(ecriture.CompteNum.substring(0,2)) && ecriture.CompteNum.substring(0,3)!="603")
  { 
    // check if 609
    let isRefund = (ecriture.CompteNum.substring(0,3)=="609");

    // lecture du compte auxiliaire
    let ecritureAux = book.filter(ecritureAux => ecritureAux.EcritureNum == ecriture.EcritureNum 
                                              && ecritureAux.CompteNum.substring(0,2)=="40")[0] || {};
    
    // expense data
    let expenseData = 
    {
      label: ecriture.EcritureLib.replace(/^\"/,"").replace(/\"$/,""),
      account: isRefund ? "60"+ecriture.CompteNum.substring(3)+"0" :  ecriture.CompteNum,
      accountLib: ecriture.CompteLib,
      accountAux: ecritureAux.CompAuxNum || ecritureAux.CompteNum || "_"+ecriture.CompteNum,
      accountAuxLib: ecritureAux.CompAuxLib || ecritureAux.CompAuxLib || "DEPENSES "+ecriture.CompteLib,
      amount: (isRefund ? -1 : 1) * (parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit)),
    }

    // push data
    data.expenses.push(expenseData);
  }

  // Stocks variation (603) --------------------------------------------------------------------------- //
  if (ecriture.CompteNum.substring(0,3)=="603")
  {    
    // retrieve stock entry
    let ecritureStock = book.filter(ecritureStock => ecritureStock.EcritureNum == ecriture.EcritureNum 
                                                  && ecritureStock.EcritureLib == ecriture.EcritureLib
                                                  && ecritureStock.CompteNum.charAt(0)=="3")[0] || {};
    if (data.accounts[ecritureStock.CompteNum]==undefined) data.accounts[ecritureStock.CompteNum] = (ecritureStock.CompteLib || "").replace(/ *$/,"").replace(/^\"/,"").replace(/\"$/,"");
      
    // retrieve stock variation item
    let stockVariation = data.stocksVariations.filter(stockVariation => stockVariation.account == ecriture.CompteNum
                                                                     && stockVariation.accountAux == ecritureStock.CompteNum)[0];

    // if stock variation already defined
    if (stockVariation!=undefined) stockVariation.amount+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
    
    // if stock variation undefined
    else
    {
      let prevAmount = data.stocks.filter(stock => stock.account == ecritureStock.CompteNum).map(stock => stock.prevAmount)[0] || 0;
      let stockVariationData = 
      {
        account: ecriture.CompteNum,
        accountLib: ecriture.CompteLib,
        accountAux: ecritureStock.CompteNum,
        isProductionStock: false,
        label: ecriture.CompteLib.replace(/^\"/,"").replace(/\"$/,""),
        amount: prevAmount + parseAmount(ecriture.Debit) - parseAmount(ecritureStock.Credit),
      }
      data.stocksVariations.push(stockVariationData);
    }
  }

  // Dotations aux amortissements sur immobilisations (6811) ------------------------------------------ //
  if (ecriture.CompteNum.substring(0,4)=="6811")
  {
    // retrieve amortisation accounts
    book.filter(ecritureDepreciation => ecritureDepreciation.EcritureNum == ecriture.EcritureNum 
             && ecritureDepreciation.EcritureLib == ecriture.EcritureLib
             && ecritureDepreciation.CompteNum.substring(0,2)=="28")
        .forEach((ecritureDepreciation) => 
    {
      let depreciation = data.depreciations.filter(depreciation => depreciation.account == ecritureDepreciation.CompteNum)[0];
      
      // if depreciation already defined
      if (depreciation!=undefined) depreciation.amount+= parseAmount(ecritureDepreciation.Credit) - parseAmount(ecritureDepreciation.Debit);
      
      // if depreciation undefined
      else if (ecritureDepreciation!=undefined)
      {
        let depreciationData = 
        {
          account: ecritureDepreciation.CompteNum,
          accountLib: ecritureDepreciation.CompteLib,
          accountAux: "2"+ecritureDepreciation.CompteNum.substring(2)+"0",
          label: ecritureDepreciation.CompteLib.replace(/^\"/,"").replace(/\"$/,""),
          amount: parseAmount(ecritureDepreciation.Credit) - parseAmount(ecritureDepreciation.Debit),
        }
        data.depreciations.push(depreciationData);
      }
    })
  }

  // Other expenses ----------------------------------------------------------------------------------- //
  if (ecriture.CompteNum.substring(0,2)=="63") data.taxes+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  if (ecriture.CompteNum.substring(0,2)=="64") data.personnelExpenses+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  if (ecriture.CompteNum.substring(0,2)=="65") data.otherExpenses+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  if (ecriture.CompteNum.substring(0,2)=="66") data.financialExpenses+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  if (ecriture.CompteNum.substring(0,2)=="67") data.exceptionalExpenses+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  if (ecriture.CompteNum.substring(0,2)=="68" & ecriture.CompteNum.substring(0,4)!="6811") data.provisions+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);
  if (ecriture.CompteNum.substring(0,2)=="69") data.taxOnProfits+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);

}

/* ---------- COMPTES DE PRODUITS ---------- */

const readProductionEntry = async (data,book,ecriture) =>
{
  /*  LISTE DES COMPTES DE PRODUITS - NIV 1
  ----------------------------------------------------------------------------------------------------
    Comptes 70 - Ventes de produits -> revenue
    Comptes 71 - Production stockée / déstockée
    Comptes 72 - Production immobilisée
    Comptes 74 - Subventions d'exploitation
    Comptes 75 - Autres produits de gestion courante
    Comptes 76 - Produits financiers (non traités)
    Comptes 77 - Produits exceptionnels (non traités)
    Comptes 78 - Reprises sur amortissements, dépréciations et provisions (seulement sur exploitation)
    Comptes 79 - Transferts de charges (seulement sur exploitation)
  ----------------------------------------------------------------------------------------------------
  */

  // Revenue ------------------------------------------------------------------------------------------ //
  if (ecriture.CompteNum.substring(0,2)=="70") data.revenue+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);
  
  // Stored/Unstored Production ----------------------------------------------------------------------- //
  if (ecriture.CompteNum.substring(0,2)=="71")
  {
    // retrieve stock entry
    let ecritureStock = book.filter(ecritureStock => ecritureStock.EcritureNum == ecriture.EcritureNum 
                                                  && ecritureStock.EcritureLib == ecriture.EcritureLib
                                                  && ecritureStock.CompteNum.charAt(0)=="3")[0] || {};

    // retrieve stock variation item
    let stockVariation = data.stocksVariations.filter(stockVariation => stockVariation.account == ecritureStock.CompteNum
                                                                     && stockVariation.accountAux == ecriture.CompteNum)[0];
    
    // if stock variation already defined
    if (stockVariation!=undefined) stockVariation.amount+= parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit);

    // if stock variation undefined
    else
    {
      let stockVariationData = 
      {
        account: ecritureStock.CompteNum,
        accountLib: ecritureStock.CompteLib,
        accountAux: ecriture.CompteNum,
        isProductionStock: true,
        label: ecriture.CompteLib.replace(/^\"/,"").replace(/\"$/,""),
        amount: parseAmount(ecriture.Debit) - parseAmount(ecriture.Credit),
      }
      data.stocksVariations.push(stockVariationData);
    }
  }
  
  // Immobilised Production --------------------------------------------------------------------------- //
  if (ecriture.CompteNum.substring(0,2)=="72") data.immobilisedProduction+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);
  
  // Other operating incomes -------------------------------------------------------------------------- //
  if (ecriture.CompteNum.substring(0,2)=="74") data.otherOperatingIncomes+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);
  if (ecriture.CompteNum.substring(0,2)=="75") data.otherOperatingIncomes+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);
  if (ecriture.CompteNum.substring(0,3)=="781") data.otherOperatingIncomes+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);
  if (ecriture.CompteNum.substring(0,3)=="791") data.otherOperatingIncomes+= parseAmount(ecriture.Credit) - parseAmount(ecriture.Debit);

}

/* ---------- DONNEES SUPPLEMENTAIRES ---------- */

const readAddtionalDataEntry = async (data,book,ecriture) =>
{
  /*  LISTE DES COMPTES
  ----------------------------------------------------------------------------------------------------
    Comptes 6312 - Ventes de produits -> revenue
    Comptes 6313 - Production stockée / déstockée
    Comptes 6333 - Production immobilisée
  ----------------------------------------------------------------------------------------------------
  */

  // Data for KNW ------------------------------------------------------------------------------------- //
  // ...taxe d'apprentissage
  if (["6312"].includes(ecriture.CompteNum.substring(0,4))) data.KNWData.apprenticeshipTax+= parseAmount(ecriture.Debit);
  // ...participation formation professionnelle
  if (["6313","6333"].includes(ecriture.CompteNum.substring(0,4))) data.KNWData.vocationalTrainingTax+= parseAmount(ecriture.Debit);

}