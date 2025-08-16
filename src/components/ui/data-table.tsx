"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /**
   * Callback disparado quando uma célula é editada e confirmada.
   * Recebe a linha original, o id da coluna e o novo valor.
   */
  onEdit?: (row: TData, columnId: string, value: unknown) => void | Promise<void>
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onEdit,
}: DataTableProps<TData, TValue>) {
  const [editingCell, setEditingCell] = React.useState<
    { rowId: string; columnId: string } | null
  >(null)

  const startEditing = (rowId: string, columnId: string) =>
    setEditingCell({ rowId, columnId })
  const stopEditing = () => setEditingCell(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isEditing =
                      editingCell?.rowId === row.id &&
                      editingCell.columnId === cell.column.id
                    return (
                      <TableCell
                        key={cell.id}
                        onDoubleClick={() =>
                          startEditing(row.id, cell.column.id)
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, {
                          ...cell.getContext(),
                          isEditing,
                          startEditing: () =>
                            startEditing(row.id, cell.column.id),
                          stopEditing,
                          onEdit,
                        })}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
