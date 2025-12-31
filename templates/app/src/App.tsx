import './App.css';

const APP_NAME = '{{name}}';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>{APP_NAME}</h1>
        <p>Welcome to {APP_NAME} app</p>
      </header>
    </div>
  );
}

export default App;

