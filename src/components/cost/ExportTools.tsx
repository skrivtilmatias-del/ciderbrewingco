import { Button } from '@/components/ui/button';
import { Download, FileText, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SimulationResult } from '@/types/costManagement.types';

interface ExportToolsProps {
  simulation: SimulationResult | null;
  onSave?: () => void;
}

export function ExportTools({ simulation, onSave }: ExportToolsProps) {
  const handleExportCSV = () => {
    if (!simulation) {
      toast.error('No simulation data to export');
      return;
    }

    try {
      // Prepare CSV header
      const headers = [
        'Year', 'Revenue (DKK)', 'COGS (DKK)', 'Gross Profit (DKK)', 'Gross Margin %',
        'EBITDA (DKK)', 'EBITDA Margin %', 'Depreciation (DKK)', 'EBIT (DKK)',
        'Interest (DKK)', 'Tax (DKK)', 'Net Income (DKK)', 'Net Margin %',
        'Cash Balance (DKK)', 'Cumulative Cash (DKK)'
      ];

      // Prepare CSV rows
      const rows = simulation.yearly_projections.map(p => [
        p.year,
        p.total_revenue.toFixed(2),
        p.total_cogs.toFixed(2),
        p.gross_profit.toFixed(2),
        p.gross_margin_percent.toFixed(2),
        p.ebitda.toFixed(2),
        p.ebitda_margin_percent.toFixed(2),
        p.depreciation.toFixed(2),
        p.ebit.toFixed(2),
        p.interest_expense.toFixed(2),
        p.tax.toFixed(2),
        p.net_income.toFixed(2),
        p.net_margin_percent.toFixed(2),
        p.cash_balance.toFixed(2),
        p.cumulative_cash_flow.toFixed(2),
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
        '',
        'SUMMARY',
        `Total Revenue,${simulation.total_revenue.toFixed(2)}`,
        `Total EBITDA,${simulation.total_ebitda.toFixed(2)}`,
        `Avg EBITDA Margin %,${simulation.avg_ebitda_margin_percent.toFixed(2)}`,
        `Breakeven Year,${simulation.breakeven_year !== undefined ? simulation.breakeven_year + 1 : 'N/A'}`,
        `ROI %,${simulation.roi_percent?.toFixed(2) || 'N/A'}`,
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cost_simulation_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast.success('Exported CSV successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportJSON = () => {
    if (!simulation) {
      toast.error('No simulation data to export');
      return;
    }

    try {
      const dataStr = JSON.stringify(simulation, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cost_simulation_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exported JSON successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export JSON');
    }
  };

  const handleShare = () => {
    toast.info('Share functionality coming soon');
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportCSV} variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <Button onClick={handleExportJSON} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export JSON
      </Button>
      <Button onClick={handleShare} variant="outline" size="sm">
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      {onSave && (
        <Button onClick={onSave} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Save to Database
        </Button>
      )}
    </div>
  );
}
