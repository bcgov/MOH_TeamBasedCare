import React from "react";

function objectValues<T extends {}>(obj: T) {
    return Object.keys(obj).map((objKey) => obj[objKey as keyof T]);
}

function objectKeys<T extends {}>(obj: T) {
    return Object.keys(obj).map((objKey) => objKey as keyof T);
}

type PrimitiveType = string | Symbol | number | boolean;

// Type guard for the primitive types which will support printing
// out of the box
function isPrimitive(value: any): value is PrimitiveType {
    return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "symbol"
    );
}

/** Component */

interface MinTableItem {
    id: PrimitiveType;
}

type TableHeaders<T extends MinTableItem> = Record<keyof T, string>;

type CustomRenderers<T extends MinTableItem> = Partial<
    Record<keyof T, (it: T) => React.ReactNode>
>;

interface TableProps<T extends MinTableItem> {
    items: T[];
    headers: TableHeaders<T>;
    customRenderers?: CustomRenderers<T>;
}

export default function Table<T extends MinTableItem>(props: TableProps<T>) {
    function renderRow(item: T) {
        return (
            <tr className="border-b">
                {objectKeys(item).map((itemProperty) => {
                    const customRenderer = props.customRenderers?.[itemProperty];

                    if (customRenderer) {
                        return <td>{customRenderer(item)}</td>;
                    }

                    return (
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            {isPrimitive(item[itemProperty]) ? item[itemProperty] : ""}
                        </td>
                    );
                })}
            </tr>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white border-b">
                                {objectValues(props.headers).map((headerValue) => (
                                    <th scope="col" className="text-sm font-bold text-gray-900 px-6 py-4 text-left">{headerValue}</th>
                                ))}
                            </thead>
                            <tbody>{props.items.map(renderRow)}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Referance usage

    <Table
        headers={tableHeaders}
        items={tableBody}

        customRenderers={{
          test: (it) => (
            <img
              alt={`${it.FSA}`}
              src={it.test.url}
              width={it.test.width}
              height={it.test.height}
            />
          ),
          edit: (it) => (
            <button 
              onClick={()=>(alert(it.id))}
              >{it.edit.name}
              </button>
          ),
        }}
    />
*/
/* Objects to display in Table component

    const tableHeaders = {
        id: "Id",
        firstName: "Last Name",
        lastName: "First Name",
        FSA: "FSA",
        phone: "Phone Number",
        email: "Email Address",
        preferredRegions: "Preffered Regions",
        test: "Image",
        edit: "Actions",
    };


    const tableBody = [{
    id: 1,
    firstName: "Last Name",
    lastName: "First Name",
    FSA: "FSA",
    phone: "Phone Number",
    email: "Email Address",
    preferredRegions: "Preffered Regions",
    edit: {
      name: "Edit",
    },
    test: {
      url:
        "https://user-images.githubusercontent.com/14864439/101538058-52edaa00-397b-11eb-8107-ea606bf90929.png",
      width: 100,
      height: 50
    }
  },{
    id: 2,
    firstName: "Peter",
    lastName: "Pavlatos",
    FSA: "asdsdasda",
    phone: "514-888-4561",
    email: "bobloblaw@bla.ca",
    preferredRegions: "Preffered Regions",
    edit: {
      name: "Edit",
    },
    test: {
      url:
        "https://user-images.githubusercontent.com/14864439/101538104-61d45c80-397b-11eb-8c56-b2de523b9aa3.png",
      width: 100,
      height: 50
    }
  },
  {
    id: 3,
    firstName: "Peter",
    lastName: "Pavlatos",
    FSA: "asdsdasda",
    phone: "514-888-4561",
    email: "bobloblaw@bla.ca",
    preferredRegions: "Preffered Regions",
    edit: {
      name: "Edit",
    },
    test: {
      url:
        "https://user-images.githubusercontent.com/14864439/101538129-68fb6a80-397b-11eb-8250-e622fdf0f34c.png",
      width: 100,
      height: 50
    }
  }];

*/

