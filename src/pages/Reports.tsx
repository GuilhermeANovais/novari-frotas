import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAllData } from '../hooks/useAllData';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton'; // <--- Skeleton
import { FileSpreadsheet, ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // <--- Toast

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function Reports() {
  const navigate = useNavigate();
  const { vehicles, loading } = useAllData();

  // --- Processamento de Dados ---
  const costsByDept: Record<string, number> = {};
  
  vehicles.forEach(v => {
    const dept = v.department || 'Outros';
    const cost = v.totalCost || 0;
    costsByDept[dept] = (costsByDept[dept] || 0) + cost;
  });

  const chartLabels = Object.keys(costsByDept).sort();
  const chartValues = chartLabels.map(dept => costsByDept[dept]);

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Custo Total (R$)',
      data: chartValues,
      backgroundColor: 'rgba(24, 24, 27, 0.8)', // Zinc-900 com transparência
      borderColor: 'rgba(24, 24, 27, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }, // Minimalista
      title: { display: false },
    },
    scales: {
        y: {
            grid: { color: '#f4f4f5' }, // Zinc-100
            ticks: { callback: (value: any) => `R$ ${value}` }
        },
        x: { grid: { display: false } }
    }
  };

  const handleExportExcel = async () => {
    if (vehicles.length === 0) return toast.warning("Sem dados para exportar.");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Frota Completa');

      worksheet.columns = [
        { header: 'Placa', key: 'licensePlate', width: 15 },
        { header: 'Modelo', key: 'model', width: 25 },
        { header: 'Departamento', key: 'department', width: 20 },
        { header: 'Situação', key: 'situation', width: 15 },
        { header: 'Custo Total', key: 'totalCost', width: 15, style: { numFmt: '"R$"#,##0.00' } },
        { header: 'KM Atual', key: 'currentMileage', width: 15 },
        { header: 'Última Revisão', key: 'lastReviewDate', width: 15 },
      ];

      vehicles.forEach(v => {
        worksheet.addRow({
          licensePlate: v.licensePlate,
          model: v.model,
          department: v.department,
          situation: v.situation,
          totalCost: v.totalCost || 0,
          currentMileage: v.currentMileage || 0,
          lastReviewDate: v.lastReviewDate ? new Date(v.lastReviewDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'
        });
      });

      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `relatorio_frota_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar Excel.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')} 
            className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Relatórios Financeiros</h1>
            <p className="text-zinc-500 text-sm">Análise de custos e exportação de dados</p>
          </div>
        </div>
        
        <Button onClick={handleExportExcel} disabled={loading} className="w-full md:w-auto">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Baixar Relatório Excel
        </Button>
      </div>

      {loading ? (
        // Loading State com Skeletons
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm h-[400px] flex flex-col gap-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-end gap-4 h-full pb-4">
                 <Skeleton className="w-full h-1/3" />
                 <Skeleton className="w-full h-2/3" />
                 <Skeleton className="w-full h-1/2" />
                 <Skeleton className="w-full h-3/4" />
                 <Skeleton className="w-full h-full" />
              </div>
           </div>
           <div className="bg-white rounded-lg border border-zinc-200 h-64 p-6">
              <div className="space-y-4">
                 <Skeleton className="h-8 w-full" />
                 <Skeleton className="h-8 w-full" />
                 <Skeleton className="h-8 w-full" />
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          
          {/* Gráfico */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                   <BarChart3 className="w-5 h-5 text-zinc-500" />
                   Custo Total por Departamento
                </h3>
             </div>
             <div className="h-[400px] w-full flex justify-center">
                {Object.keys(costsByDept).length > 0 ? (
                    <Bar options={chartOptions} data={chartData} />
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 h-full">
                        <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                        <p>Sem dados financeiros registrados.</p>
                    </div>
                )}
             </div>
          </div>

          {/* Tabela de Resumo */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 font-semibold text-zinc-700 text-sm">
                Detalhamento dos Custos
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-600">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">Departamento</th>
                            <th className="px-6 py-3 text-center font-medium">Qtd. Veículos</th>
                            <th className="px-6 py-3 text-right font-medium">Custo Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartLabels.map(dept => (
                            <tr key={dept} className="bg-white border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-900">{dept}</td>
                                <td className="px-6 py-4 text-center">
                                    {vehicles.filter(v => v.department === dept).length}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-zinc-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costsByDept[dept])}
                                </td>
                            </tr>
                        ))}
                        {/* Linha de Total Geral */}
                        <tr className="bg-zinc-50 font-semibold text-zinc-900">
                            <td className="px-6 py-4">TOTAL GERAL</td>
                            <td className="px-6 py-4 text-center">{vehicles.length}</td>
                            <td className="px-6 py-4 text-right font-mono">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartValues.reduce((a, b) => a + b, 0))}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
