// Calcula o status da revisão do veículo
export const getReviewStatus = (lastReviewDateStr?: string) => {
    if (!lastReviewDateStr) return 'ok';
    const lastReview = new Date(lastReviewDateStr + 'T00:00:00');
    const nextReview = new Date(lastReview);
    nextReview.setMonth(nextReview.getMonth() + 6); // 6 meses
    const today = new Date();
    
    // Diferença em milissegundos
    const diffTime = nextReview.getTime() - today.getTime();
    // Converter para dias
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'error'; // Atrasada
    if (daysLeft <= 30) return 'warning'; // Próxima (30 dias)
    return 'ok';
};

// Calcula o status da CNH do motorista
export const getDriverStatus = (expirationDateStr?: string) => {
    if (!expirationDateStr) return 'ok';
    const expiration = new Date(expirationDateStr + 'T00:00:00');
    const today = new Date();
    
    const diffTime = expiration.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'error'; // Vencida
    if (daysLeft <= 45) return 'warning'; // A vencer (45 dias)
    return 'ok';
};

// Calcula o status da troca de óleo/peças por KM
export const getMileageStatus = (current: number, next: number) => {
    if (!next || next <= 0) return { status: 'ok', text: '' };
    
    const remaining = next - current;

    if (remaining < 0) return { status: 'error', text: `Venceu há ${Math.abs(remaining)} km` };
    if (remaining <= 1000) return { status: 'warning', text: `Faltam ${remaining} km` };
    
    return { status: 'ok', text: '' };
};
