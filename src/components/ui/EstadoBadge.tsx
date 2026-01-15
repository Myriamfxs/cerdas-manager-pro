import { cn } from '@/lib/utils';
import { EstadoCerda, ESTADO_LABELS, ESTADO_COLORS } from '@/types/database';

interface EstadoBadgeProps {
  estado: EstadoCerda;
  className?: string;
}

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  return (
    <span
      className={cn(
        "badge-estado",
        ESTADO_COLORS[estado],
        className
      )}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}
