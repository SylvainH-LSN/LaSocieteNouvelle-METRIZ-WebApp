import React, { useState } from "react";
import { Table } from "react-bootstrap";
import Select from "react-select";


// Utils
import {
  getAreasOptions,
  getDivisionsOptions
} from "/src/utils/metaUtils";
import { printValue } from "/src/utils/formatters";
import { getUnidentifiedProviderStatusIcon } from "./utils";
import { sortProviders as sortAccounts } from "../utils";

// Select Style
import { customSelectStyles } from "/config/customStyles";

// Libs
import divisions from "/lib/divisions";
import areas from "/lib/areas";

const ExpenseAccountsTable = ({
  providers,
  accounts,
  startIndex,
  endIndex,
  significativeProviders,
  financialPeriod,
  setAccountDefaultFootprintParams
}) => {
  // Sorting for providers
  const [sorting, setSorting] = useState({
    sortColumn: null,
    sortOrder: "asc",
  });

  const { sortColumn, sortOrder } = sorting;

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSorting((prevState) => ({
        ...prevState,
        sortOrder: sortOrder === "asc" ? "desc" : "asc",
      }));
    } else {
      setSorting((prevState) => ({
        ...prevState,
        sortColumn: column,
        sortOrder: "asc",
      }));
    }
  };

  const sortedAccounts = sortAccounts(
    accounts,
    sortColumn,
    sortOrder,
    financialPeriod
  );

  // Select Options
  const divisionsOptions = getDivisionsOptions(divisions);
  const areasOptions = getAreasOptions(areas);

  // show note
  const showSignificativeNote = providers.some(
    (provider) =>
      significativeProviders.includes(provider.providerNum) &&
      provider.defaultFootprintParams.code === "00"
  );

  // Check if significant providers are unassigned
  const hasWarning = (account) => {
    return (
      significativeProviders.includes(account.accountNum) &&
      account.defaultFootprintParams.code == "00"
    );
  };


  return (
    <>
      <Table>
        <thead>
          <tr>
            <th width={10}></th>
            <th
              onClick={() => handleSort("libelle")}
            >
              <i className="bi bi-arrow-down-up me-1"></i>
              Libellé du compte fournisseur
            </th>
            <th>Compte fournisseur</th>
            <th>Espace économique</th>
            <th>Secteur d'activité</th>
            <th className="text-end" onClick={() => handleSort("montant")}>
              <i className="bi bi-arrow-down-up me-1"></i>
              Montant
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAccounts
            .slice(startIndex, endIndex)
            .map((account, index) => (
              <tr key={account.accountNum}>
                <td>
                  <div className="d-flex">
                    <i
                      className={
                        getUnidentifiedProviderStatusIcon(account).className
                      }
                      title={getUnidentifiedProviderStatusIcon(account).title}
                    ></i>
                    {hasWarning(account) && (
                      <i
                        className="bi bi-exclamation-triangle text-warning"
                        title="Grand risque d'imprécision"
                      ></i>
                    )}
                  </div>
                </td>
                <td>{account.accountLib}</td>
                <td>{account.accountNum}</td>
                <td>
                  <Select
                    styles={customSelectStyles("150px")}
                    value={{
                      label: areas[account.defaultFootprintParams.area],
                      value: account.defaultFootprintParams.area,
                    }}
                    placeholder={"Choisissez un espace économique"}
                    className={
                      account.footprintStatus == 200 &&
                      account.footprint.isValid()
                        ? "success"
                        : ""
                    }
                    options={areasOptions}
                    onChange={(e) =>
                      setAccountDefaultFootprintParams(
                        account.accountNum,
                        "area",
                        e.value
                      )
                    }
                  />
                </td>
                <td>
                  <Select
                    styles={customSelectStyles(
                      "500px",
                      account.footprintStatus,
                      hasWarning(account)
                    )}
                    value={{
                      label:
                        account.defaultFootprintParams.code +
                        " - " +
                        divisions[account.defaultFootprintParams.code],
                      value: account.defaultFootprintParams.code,
                    }}
                    placeholder={"Choisissez un secteur d'activité"}
                    className={
                      account.footprintStatus == 200 &&
                      account.footprint.isValid()
                        ? "success"
                        : ""
                    }
                    options={divisionsOptions}
                    onChange={(e) =>
                      setAccountDefaultFootprintParams(
                        account.accountNum,
                        "code",
                        e.value
                      )
                    }
                  />
                </td>
                <td className="text-end">
                  {printValue(
                    account.periodsData[financialPeriod.periodKey].amount,
                    0
                  )}{" "}
                  &euro;
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
      {showSignificativeNote && (
        <p className="small border-warning">
          <i
            className="bi bi-exclamation-triangle text-warning"
            title="Grand risque d'imprécision"
          ></i>{" "}
          Compte significatifs non rattachés à un secteur d'activité
        </p>
      )}
    </>
  );
};

export default ExpenseAccountsTable;