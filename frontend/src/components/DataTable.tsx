import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import React from "react";

function DataTable({ data }: { data: any[] }) {
  // Step 1: Define columns (dynamically from your data or manually)
  const columns = React.useMemo<ColumnDef<any>[]>(
    () =>
      data.length > 0
        ? Object.keys(data[0]).map((key) => ({
            accessorKey: key, // field name in the data
            header: key,      // column header label
          }))
        : [],
    [data]
  );

  // Step 2: Create table instance
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 25 });
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    pageCount: Math.ceil(data.length / 10),
  });

  // Step 3: Render
  return (
    <>
      <table className="table-auto border-collapse border border-gray-400 w-full text-sm mt-4">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border border-gray-400 px-2 py-1 text-left"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border border-gray-400 px-2 py-1"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex justify-between">
        <button
          className="px-3 py-1 border border-gray-400 rounded disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 border border-gray-400 rounded disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </>
  );
}

export default DataTable;