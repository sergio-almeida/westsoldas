import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'Aberta':
      case 'Pendente':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Em reparo':
      case 'Em análise':
      case 'Em diagnóstico':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Aguardando peças':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Finalizada':
      case 'Aprovado':
      case 'Pago':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Entregue':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Cancelada':
      case 'Reprovado':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;