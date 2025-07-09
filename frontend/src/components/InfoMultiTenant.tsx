import { useSubdominio } from '../hooks/useSubdominio';

const InfoMultiTenant = () => {
  const { subdominio, empresa, esSubdominioPrincipal } = useSubdominio();

  return (
    <div className="info-multitenant">
      <div className="contenedor">
        <div className="tarjeta">
          <h3>Información del Sistema Multi-Tenant</h3>
          
          <div className="info-detalle">
            <p><strong>URL actual:</strong> {window.location.href}</p>
            <p><strong>Hostname:</strong> {window.location.hostname}</p>
            <p><strong>Es dominio principal:</strong> {esSubdominioPrincipal ? 'Sí' : 'No'}</p>
            
            {subdominio && (
              <p><strong>Subdominio detectado:</strong> {subdominio}</p>
            )}
            
            {empresa && (
              <div className="info-empresa">
                <h4>Información de la Empresa:</h4>
                <p><strong>Nombre:</strong> {empresa.nombre}</p>
                <p><strong>Subdominio:</strong> {empresa.subdominio}</p>
                <p><strong>Email:</strong> {empresa.email}</p>
                {empresa.logoUrl && (
                  <p><strong>Logo:</strong> <img src={empresa.logoUrl} alt="Logo" style={{ height: '30px' }} /></p>
                )}
                <p><strong>Color primario:</strong> <span style={{ backgroundColor: empresa.colorPrimario, padding: '4px 8px', color: 'white' }}>{empresa.colorPrimario}</span></p>
              </div>
            )}
          </div>

          <div className="prueba-subdominios">
            <h4>Para probar el sistema multi-tenant:</h4>
            <ol>
              <li>En el dominio principal (localhost:5173), registra una empresa con subdominio "ejemplo"</li>
              <li>Modifica tu archivo hosts para que "ejemplo.localhost" apunte a 127.0.0.1</li>
              <li>Visita "http://ejemplo.localhost:5173" para ver la tienda personalizada</li>
              <li>También funciona con subdominios reales en producción</li>
            </ol>
            
            <div className="comando-hosts">
              <h5>Agregar al archivo hosts (Windows: C:\Windows\System32\drivers\etc\hosts):</h5>
              <code>127.0.0.1 ejemplo.localhost</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoMultiTenant;
