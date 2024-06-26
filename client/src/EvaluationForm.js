import React, { useState, useEffect } from 'react';
import './EvaluationForm.css';

function EvaluationForm() {
  const [projectInfo, setProjectInfo] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleCriteria, setVisibleCriteria] = useState({});
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const idUsuario = localStorage.getItem('id_usuario');

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (idUsuario) {
      fetch(`${apiUrl}/evaluaciones/${idUsuario}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            console.log('Datos recibidos del backend:', data);
            setProjectInfo(data.projectInfo);
            setEvaluaciones(data.evaluaciones);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching project info:', error);
          setError('Error al cargar la información del proyecto');
          setLoading(false);
        });
    }
  }, [idUsuario, apiUrl]);

  const handleNextPage = () => {
    if (currentPage > 0) {
      enviarCalificaciones();
    }
    setCurrentPage(currentPage + 1);
    window.scrollTo(0, 0); // Lleva la página al principio
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0); // Lleva la página al principio
    }
  };

  const toggleCriterioVisibility = (criterioId) => {
    setVisibleCriteria({
      ...visibleCriteria,
      [criterioId]: !visibleCriteria[criterioId]
    });
  };

  const handleCalificacionChange = (evaluacionId, criterioId, value) => {
    setCalificaciones({
      ...calificaciones,
      [evaluacionId]: {
        ...calificaciones[evaluacionId],
        [criterioId]: value
      }
    });
    console.log(`Evaluacion ID: ${evaluacionId}, Criterio ID: ${criterioId}, Valor: ${value}`);
  };

  const enviarCalificaciones = () => {
    const calificacionesPorProveedor = Object.keys(calificaciones).map(id_proveedor => ({
      id_proveedor,
      id_usuario: idUsuario,  // Añadir id_usuario aquí
      calificaciones: Object.keys(calificaciones[id_proveedor]).map(id_criterio => ({
        id_criterio,
        calificacion: calificaciones[id_proveedor][id_criterio],
      })),
    }));

    fetch(`${apiUrl}/actualizar-calificaciones`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calificacionesPorProveedor),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al actualizar las calificaciones');
        }
        return response.json();
      })
      .then(data => {
        console.log('Calificaciones actualizadas:', data);
      })
      .catch(error => console.error('Error al actualizar las calificaciones:', error));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    enviarCalificaciones();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="no-evaluaciones-container">
        No se encontraron evaluaciones asignadas al usuario.
      </div>
    );
  }

  if (!projectInfo || evaluaciones.length === 0) {
    return (
      <div className="no-evaluaciones-container">
        No se encontraron evaluaciones asignadas al usuario.
      </div>
    );
  }

  const evaluacionActual = evaluaciones[currentPage - 1];

  return (
    <div>
      <header className="header">
        <div id="project-name">
          {projectInfo ? `Proyecto: ${projectInfo.nombre_proyecto} del cliente: ${projectInfo.nombre_cliente}` : 'Loading...'}
        </div>
        <img src="https://itxconsultoria.com/wp-content/uploads/2022/07/IT-Experts-ITX-Consultoria-@2x.png" alt="Logo" />
      </header>
      <form onSubmit={handleFormSubmit}>
        {currentPage === 0 && (
          <div className="welcome-container">
            <div id="welcome-message">
              <img src="https://itxconsultoria.com/wp-content/uploads/2022/07/IT-Experts-ITX-Consultoria-@2x.png" alt="Imagen de Bienvenida" />
              <p>Bienvenido, nos complace darle la bienvenida a esta evaluación donde se presentarán los diversos proveedores del proyecto <strong><span id="project-name-placeholder">{projectInfo ? `Proyecto: ${projectInfo.nombre_proyecto} del cliente: ${projectInfo.nombre_cliente}` : 'Loading...'}</span></strong> que serán evaluados. Durante el formulario, tendrá la oportunidad de conocer en detalle a cada proveedor sus categorías y criterios. Su participación activa y su criterio serán fundamentales en este proceso. ¡Comencemos!</p>
              <div className="buttons">
                <button type="button" onClick={handleNextPage}>➡</button>
              </div>
            </div>
          </div>
        )}

        {evaluaciones.length > 0 && currentPage > 0 && evaluacionActual && (
          <div className="form" id="formContainer">
            <div key={currentPage}>
              <h3>Proveedor <strong>{evaluacionActual.nombre_proveedor}</strong> {currentPage} de {evaluaciones.length}</h3>
              <p>A continuación, encontrará el formulario de evaluación del proveedor. {evaluacionActual.nombre_proveedor}, el cual utiliza una escala del 1 al 5, donde 1 representa la calificación más baja y 5 la más alta.</p>
              <ul>
                {Object.values(evaluacionActual.categorias).map((categoria, catIndex) => (
                  <li key={`${currentPage}-${catIndex}`}>
                    <strong>Categoría: {categoria.nombre_categoria}</strong>
                    <p>{categoria.descripcion_categoria}</p>
                    <ul>
                      {categoria.criterios.map((criterio, critIndex) => (
                        <li key={criterio.id_criterio}>
                          <div onClick={() => toggleCriterioVisibility(criterio.id_criterio)} className="dropdown-header">
                            <span className={`arrow ${visibleCriteria[criterio.id_criterio] ? 'up' : 'down'}`}>&#9654;</span>
                            {critIndex + 1}. Criterio: {criterio.nombre_criterio}
                          </div>
                          {visibleCriteria[criterio.id_criterio] && (
                            <div className="dropdown-content">
                              <p>{criterio.descripcion_criterio}</p>
                              {criterio.tipopregunta_criterio === 'cerrada' ? (
                                [1, 2, 3, 4, 5].map(value => (
                                  <label key={value} className="radio-label">
                                    <input
                                      type="radio"
                                      name={`calificacion-${evaluacionActual.id_proveedor}-${criterio.id_criterio}`}
                                      value={value}
                                      checked={calificaciones[evaluacionActual.id_proveedor]?.[criterio.id_criterio] === value}
                                      onChange={() => handleCalificacionChange(evaluacionActual.id_proveedor, criterio.id_criterio, value)}
                                    />
                                    {value}
                                    <span className="tooltip">
                                      {criterio[`descripcion_calificacion${value}_criterio`]}
                                    </span>
                                  </label>
                                ))
                              ) : (
                                <input
                                  type="text"
                                  name={`calificacion-abierta-${evaluacionActual.id_proveedor}-${criterio.id_criterio}`}
                                  value={calificaciones[evaluacionActual.id_proveedor]?.[criterio.id_criterio] || ''}
                                  onChange={(e) => handleCalificacionChange(evaluacionActual.id_proveedor, criterio.id_criterio, e.target.value)}
                                  placeholder="Escriba su respuesta aquí"
                                />
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div className="buttons">
              {currentPage > 1 && (
                <button type="button" onClick={handlePrevPage}>⬅</button>
              )}
              {currentPage < evaluaciones.length && (
                <button type="button" onClick={handleNextPage}>➡</button>
              )}
              {currentPage === evaluaciones.length && (
                <button type="submit">Enviar</button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default EvaluationForm;