// Componente principal - Especies y Recintos ya están resueltos como referencia.
// Debajo va el espacio para el catálogo de Animales - ESO es tu actividad.
import EspecieList from './components/EspecieList';
import RecintoList from './components/RecintoList';
import AnimalCatalogo from './components/AnimalCatalogo';

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🦁 ZooAPI</h1>

      <EspecieList />
      <RecintoList />
      <AnimalCatalogo />
    </div>
  );
}

export default App;