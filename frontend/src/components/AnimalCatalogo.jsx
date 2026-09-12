import { useEffect, useState } from 'react';
import { API_URL } from '../api/config';

const initialForm = {
  autor: '',
  calificacion: '5',
  comentario: '',
};

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'No se pudo completar la solicitud');
  }

  return data;
}

function AnimalCatalogo() {
  const [animales, setAnimales] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [especieId, setEspecieId] = useState('');
  const [recintoId, setRecintoId] = useState('');
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [promedio, setPromedio] = useState(null);
  const [formulario, setFormulario] = useState(initialForm);
  const [cargandoAnimales, setCargandoAnimales] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [errorFormulario, setErrorFormulario] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchJson(`${API_URL}/especies`),
      fetchJson(`${API_URL}/recintos`),
    ])
      .then(([especiesData, recintosData]) => {
        setEspecies(especiesData);
        setRecintos(recintosData);
      })
      .catch(() => setError('No se pudieron cargar los filtros'));
  }, []);

  useEffect(() => {
    const parametros = new URLSearchParams();
    if (especieId) parametros.set('especieId', especieId);
    if (recintoId) parametros.set('recintoId', recintoId);

    fetchJson(`${API_URL}/animals?${parametros}`)
      .then((data) => setAnimales(data))
      .catch(() => setError('No se pudieron cargar los animales'))
      .finally(() => setCargandoAnimales(false));
  }, [especieId, recintoId]);

  const seleccionarAnimal = (id) => {
    setCargandoDetalle(true);
    setErrorFormulario(null);
    Promise.all([
      fetchJson(`${API_URL}/animals/${id}`),
      fetchJson(`${API_URL}/animals/${id}/comments`),
    ])
      .then(([animal, comentariosData]) => {
        setAnimalSeleccionado(animal);
        setComentarios(comentariosData.comentarios);
        setPromedio(comentariosData.averageRating);
      })
      .catch(() => setError('No se pudo cargar el detalle del animal'))
      .finally(() => setCargandoDetalle(false));
  };

  const cambiarFormulario = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const cambiarEspecie = (event) => {
    setCargandoAnimales(true);
    setError(null);
    setEspecieId(event.target.value);
  };

  const cambiarRecinto = (event) => {
    setCargandoAnimales(true);
    setError(null);
    setRecintoId(event.target.value);
  };

  const enviarComentario = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setErrorFormulario(null);

    try {
      const comentario = await fetchJson(`${API_URL}/animals/${animalSeleccionado.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formulario,
          calificacion: Number(formulario.calificacion),
        }),
      });

      setComentarios((actuales) => [comentario, ...actuales]);
      setFormulario(initialForm);
      const nuevoPromedio = [...comentarios, comentario]
        .reduce((total, item) => total + item.calificacion, 0) / (comentarios.length + 1);
      setPromedio(nuevoPromedio);
    } catch (submissionError) {
      setErrorFormulario(submissionError.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section>
      <h2>Catálogo de animales</h2>

      <div>
        <label htmlFor="filtro-especie">Especie </label>
        <select id="filtro-especie" value={especieId} onChange={cambiarEspecie}>
          <option value="">Todas</option>
          {especies.map((especie) => (
            <option key={especie.id} value={especie.id}>{especie.nombre}</option>
          ))}
        </select>

        <label htmlFor="filtro-recinto"> Recinto </label>
        <select id="filtro-recinto" value={recintoId} onChange={cambiarRecinto}>
          <option value="">Todos</option>
          {recintos.map((recinto) => (
            <option key={recinto.id} value={recinto.id}>{recinto.nombre}</option>
          ))}
        </select>
      </div>

      {cargandoAnimales && <p>Cargando animales...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargandoAnimales && !error && animales.length === 0 && <p>No hay animales para estos filtros.</p>}
      {!cargandoAnimales && !error && animales.length > 0 && (
        <ul>
          {animales.map((animal) => (
            <li key={animal.id}>
              <button type="button" onClick={() => seleccionarAnimal(animal.id)}>
                {animal.nombre}
              </button>
              {' '}({animal.especie.nombre}, {animal.recinto.nombre})
            </li>
          ))}
        </ul>
      )}

      {cargandoDetalle && <p>Cargando detalle...</p>}
      {animalSeleccionado && !cargandoDetalle && (
        <article>
          <h3>{animalSeleccionado.nombre}</h3>
          <p>
            Edad: {animalSeleccionado.edad} años | Peso: {animalSeleccionado.peso ?? 'No informado'} kg
          </p>
          <p>
            {animalSeleccionado.especie.nombre} | {animalSeleccionado.recinto.nombre}
          </p>
          <h4>Comentarios {promedio !== null && `(promedio: ${promedio.toFixed(1)}/5)`}</h4>
          {comentarios.length === 0 ? <p>Aún no hay comentarios.</p> : (
            <ul>
              {comentarios.map((comentario) => (
                <li key={comentario.id}>
                  <strong>{comentario.autor}</strong> ({comentario.calificacion}/5): {comentario.comentario}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={enviarComentario}>
            <h4>Agregar comentario</h4>
            <label>
              Autor
              <input name="autor" value={formulario.autor} onChange={cambiarFormulario} required />
            </label>
            <label>
              Calificación
              <select name="calificacion" value={formulario.calificacion} onChange={cambiarFormulario}>
                {[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor}</option>)}
              </select>
            </label>
            <label>
              Comentario
              <textarea name="comentario" value={formulario.comentario} onChange={cambiarFormulario} required />
            </label>
            {errorFormulario && <p role="alert">{errorFormulario}</p>}
            <button type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Publicar comentario'}
            </button>
          </form>
        </article>
      )}
    </section>
  );
}

export default AnimalCatalogo;