import React from 'react';
import { obtenerZonaHorariaLocal, obtenerOffsetLocal } from '../utils/dateUtils';

interface TimeZoneInfoProps {
  showDetails?: boolean;
  className?: string;
}

const TimeZoneInfo: React.FC<TimeZoneInfoProps> = ({ showDetails = false, className = '' }) => {
  const zonaHoraria = obtenerZonaHorariaLocal();
  const offset = obtenerOffsetLocal();
  const offsetHoras = Math.abs(Math.floor(offset / 60));
  const offsetMinutos = Math.abs(offset % 60);
  const signo = offset <= 0 ? '+' : '-';
  const offsetFormateado = `UTC${signo}${offsetHoras.toString().padStart(2, '0')}:${offsetMinutos.toString().padStart(2, '0')}`;

  if (!showDetails) {
    return (
      <div className={className} style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <span>🌍</span>
        <span>{zonaHoraria}</span>
      </div>
    );
  }

  return (
    <div className={className} style={{
      fontSize: '0.75rem',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      background: '#f8fafc',
      borderRadius: '0.375rem',
      border: '1px solid #e2e8f0'
    }}>
      <span>🌍</span>
      <div>
        <div style={{ fontWeight: '500', color: '#374151' }}>
          Zona horaria: {zonaHoraria}
        </div>
        <div>
          Offset: {offsetFormateado}
        </div>
      </div>
    </div>
  );
};

export default TimeZoneInfo;
