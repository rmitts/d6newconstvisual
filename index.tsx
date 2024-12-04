'use client'

import { useState, useRef } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Download, Eye, Image } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toPng } from 'html-to-image'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Sample data based on the Excel screenshot
const data = [
  {
    metric: "Revenue (DEFAULT)",
    "2017": 1169.09,
    "2018": 1378.01,
    "2019": 1268.31,
    "2020": 782.74,
    "2021": 1059.22,
    "2022": 1738.74,
    "2023": 1676.62,
    "2024": 1687.33,
    "2025": 1659.86,
    "2026": 1649.90,
    "2027": 1717.55,
    "2028": 1786.25,
  },
  {
    metric: "NOPBT (DEFAULT)",
    "2017": 436.27,
    "2018": 496.75,
    "2019": 394.49,
    "2020": -26.74,
    "2021": 299.02,
    "2022": 837.02,
    "2023": 549.70,
    "2024": 462.13,
    "2025": 615.81,
    "2026": 612.11,
    "2027": 637.21,
    "2028": 662.70,
  },
  {
    metric: "ROIC (DEFAULT)",
    "2017": 0.5420,
    "2018": 0.6380,
    "2019": 0.3690,
    "2020": -0.0210,
    "2021": 0.2510,
    "2022": 0.6120,
    "2023": 0.3460,
    "2024": 0.2570,
    "2025": 0.3390,
    "2026": 0.3370,
    "2027": 0.3460,
    "2028": 0.3550,
  },
]

// Transform data for the chart
const chartData = Object.keys(data[0])
  .filter(key => key !== 'metric')
  .map(year => ({
    year,
    revenue: data[0][year],
    nopbt: data[1][year],
    roic: data[2][year] * 100, // Convert to percentage
  }))

const formatValue = (value: number, metric: string) => {
  if (typeof value !== 'number') return value
  
  if (metric.includes('ROIC') || metric.includes('Margins')) {
    return `${(value * 100).toFixed(1)}%`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    notation: 'compact',
  }).format(value)
}

export default function FinancialDashboard() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const chartRef = useRef<HTMLDivElement>(null)

  const years = Object.keys(data[0]).filter(key => key !== 'metric')
  
  const columns: ColumnDef<typeof data[0]>[] = [
    {
      accessorKey: 'metric',
      header: 'Metric',
    },
    ...years.map(year => ({
      accessorKey: year,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {year}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row, column }) => {
        const value = row.getValue(column.id) as number
        return (
          <div className={value < 0 ? 'text-red-500' : ''}>
            {formatValue(value, row.getValue('metric') as string)}
          </div>
        )
      },
    })),
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  })

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'HCC Financial Data')
    XLSX.writeFile(wb, 'HCC_financial_data.xlsx')
  }

  const exportChartToImage = async () => {
    if (chartRef.current === null) {
      return
    }

    try {
      const dataUrl = await toPng(chartRef.current, { quality: 0.95 })
      const link = document.createElement('a')
      link.download = 'financial_performance_trends.png'
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error exporting chart to image:', err)
    }
  }

  return (
    <div className="p-4 space-y-8 bg-gray-900 text-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">HCC Financial Dashboard</h2>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:text-gray-100 hover:bg-gray-700">
                Columns <Eye className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 text-gray-100 border-gray-700">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Financial Metrics Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-700">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-gray-700">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-gray-300">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-b border-gray-700">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-gray-300">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-100">Financial Performance Trends</CardTitle>
          <Button onClick={exportChartToImage} className="bg-green-600 hover:bg-green-700 text-white">
            <Image className="mr-2 h-4 w-4" />
            Export Chart
          </Button>
        </CardHeader>
        <CardContent>
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                <Line yAxisId="left" type="monotone" dataKey="nopbt" stroke="#82ca9d" name="NOPBT" />
                <Line yAxisId="right" type="monotone" dataKey="roic" stroke="#ffc658" name="ROIC (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}