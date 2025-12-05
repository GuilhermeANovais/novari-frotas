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
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function Reports() {
  const navigate = useNavigate();
  const { vehicles, loading } = useAllData();

  // --- Processamento de Dados para o Gráfico ---
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
    datasets: [
      {
        label: 'Custo Total (R$)',
        data: chartValues,
        backgroundColor: 'rgba(22, 163, 74, 0.7)', // green-600 com transparência
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Gastos Totais por Departamento' },
    },
    scales: {
        y: {
            ticks: {
                // Formata o eixo Y como moeda
                callback: (value: any) => `R$ ${value}`
            }
        }
    }
  };

  // --- Função de Exportação Excel (Atualizada para ExcelJS) ---
  const handleExportExcel = async () => {
    if (vehicles.length === 0) return alert("Sem dados para exportar.");

    // 1. Criar Workbook e Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Frota Completa');

    // 2. Definir Colunas e Cabeçalhos
    worksheet.columns = [
      { header: 'Placa', key: 'licensePlate', width: 15 },
      { header: 'Modelo', key: 'model', width: 25 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Situação', key: 'situation', width: 15 },
      { header: 'Custo Total', key: 'totalCost', width: 15, style: { numFmt: '"R$"#,##0.00' } },
      { header: 'KM Atual', key: 'currentMileage', width: 15 },
      { header: 'Última Revisão', key: 'lastReviewDate', width: 15 },
    ];

    // 3. Adicionar Linhas
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

    // 4. Estilizar Cabeçalho (Opcional, mas fica bonito)
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' }
    };

    // 5. Gerar Buffer e Salvar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `relatorio_frota_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-500 hover:text-primary p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios e Custos</h1>
        </div>
        
        <Button onClick={handleExportExcel} disabled={loading} className="w-auto">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Calculando estatísticas...</div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          
          {/* Cartão do Gráfico */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
             <div className="h-[400px] w-full flex justify-center">
                {Object.keys(costsByDept).length > 0 ? (
                    <Bar options={chartOptions} data={chartData} />
                ) : (
                    <p className="flex items-center justify-center text-gray-400">
                        Sem dados financeiros registrados.
                    </p>
                )}
             </div>
          </div>

          {/* Resumo em Tabela Simples */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b bg-gray-50 font-semibold text-gray-700">
                Detalhamento por Departamento
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Departamento</th>
                            <th className="px-6 py-3 text-center">Qtd. Veículos</th>
                            <th className="px-6 py-3 text-right">Custo Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartLabels.map(dept => (
                            <tr key={dept} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{dept}</td>
                                <td className="px-6 py-4 text-center">
                                    {vehicles.filter(v => v.department === dept).length}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-green-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costsByDept[dept])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
