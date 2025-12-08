import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Se não houver páginas suficientes, não mostra nada
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 pt-4 mt-6 animate-fade-in">
      {/* Informação de Contagem */}
      <div className="text-sm text-zinc-500">
        Mostrando <span className="font-medium text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
        <span className="font-medium text-zinc-900">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        de <span className="font-medium text-zinc-900">{totalItems}</span> resultados
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentPage === 1}
          className="px-2 py-1 h-9"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        <div className="text-sm font-medium text-zinc-700 px-2">
          Página {currentPage} de {totalPages}
        </div>

        <Button 
          variant="outline" 
          onClick={handleNext} 
          disabled={currentPage === totalPages}
          className="px-2 py-1 h-9"
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
