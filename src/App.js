import './App.css';

const readTag = async (
  onData,
  onError
) => {
  try {
    const ndef = new window.NDEFReader();
    await ndef.scan();

    ndef.addEventListener("readingerror", () => {
      console.log('error')
    });

    ndef.addEventListener("reading", ({ message, serialNumber }) => {
      alert(`> Records: (${message.records.length})`);
    });
  } catch (error) {
    alert(error.message)
  }
}

function App() {
  return (
    <div className="App">
      <button onClick={() => readTag()}>Read</button>
      <button>Write</button>
    </div>
  );
}

export default App;
