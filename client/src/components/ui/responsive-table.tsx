import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ResponsiveTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode[];
  renderCard: (item: any, index: number) => ReactNode;
  keyExtractor: (item: any, index: number) => string | number;
  className?: string;
}

export function ResponsiveTable({ 
  headers, 
  data, 
  renderRow, 
  renderCard, 
  keyExtractor,
  className = ""
}: ResponsiveTableProps) {
  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={keyExtractor(item, index)}>
                {renderRow(item, index).map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <Card key={keyExtractor(item, index)} className="border border-gray-200 dark:border-slate-700">
            <CardContent className="p-4">
              {renderCard(item, index)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}