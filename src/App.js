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
      message.records
        .filter(record => record.type === 'text')
        .forEach(record => {
          const textDecoder = new TextDecoder(record.encoding);
          alert(`Text: ${textDecoder.decode(record.data)} (${record.lang})`);
        })
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
