import { useState, useEffect, useCallback } from 'react';
import './App.css';

const FORMAT_VERSION = 'v1';
const COLORS = [
  '#cc3300',
  '#ff9966',
  '#ffcc00',
  '#99cc33',
  '#339900',
  '#BFD7EA',
];

const formatNote = (note) => `${FORMAT_VERSION};${note?.color};${note.text}`;
const parseNote = (rawText) => {
  if (rawText.startsWith(FORMAT_VERSION)) {
    const [version, color] = rawText.split(';', 2);
    const text = rawText.slice(version.length + color.length + 2);
    return { color, text };
  }
};

let writeAbortController;
let readAbortController;

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[COLORS.length - 1]);
  const [chosenText, setChosenText] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => {
    writeAbortController = new AbortController();
    readAbortController = new AbortController();

    writeAbortController.signal.onabort = (event) => {
      setIsWriting(false);
    };

    readAbortController.signal.onabort = (event) => {
      setIsReading(false);
    };
  }, [setIsReading, setIsWriting]);

  const writeTag = useCallback(async () => {
    if (!notes && !notes.length) return;
    const ndef = new window.NDEFReader();
    setIsWriting(true);
    await ndef.write(
      {
        records: notes.map((note) => ({
          recordType: 'text',
          data: formatNote(note),
        })),
      },
      { signal: writeAbortController.signal }
    );
    writeAbortController.abort();
    writeAbortController = new AbortController();
  }, [notes, setNotes]);

  const addNote = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (!selectedColor || !chosenText) return;
      setNotes((prevNotes) => [
        ...prevNotes,
        { color: selectedColor, text: chosenText },
      ]);
    },
    [notes, setNotes, chosenText, selectedColor]
  );

  const readTag = useCallback(async () => {
    try {
      const ndef = new window.NDEFReader();
      setIsReading(true);
      await ndef.scan({ signal: readAbortController.signal });
      setTimeout(() => {
        readAbortController.abort();
        readAbortController = new AbortController();
      }, 3000);
      setNotes([]);

      ndef.addEventListener('readingerror', () => {
        console.log('error');
      });

      ndef.addEventListener('reading', ({ message, serialNumber }) => {
        message.records
          .filter((record) => record.recordType === 'text')
          .forEach((record) => {
            const textDecoder = new TextDecoder(record.encoding);
            setNotes((prevNotes) => [
              ...prevNotes,
              parseNote(textDecoder.decode(record.data)),
            ]);
          });
      });
    } catch (error) {
      alert(error.message);
    }
  }, [notes, setNotes]);

  return (
    <div className="App">
      <button onClick={() => readTag()}>Read</button>
      <button onClick={() => writeTag()}>Write</button>
      <form onSubmit={addNote}>
        <div className="color-select">
          {COLORS.map((color) => (
            <div
              onClick={() => setSelectedColor(color)}
              style={{ backgroundColor: color }}
              className={`predefined-color${
                color === selectedColor ? ' selected-color' : ''
              }`}
            ></div>
          ))}
        </div>
        <input type="text" onChange={(e) => setChosenText(e.target.value)} />
        <button type="submit">add note</button>
      </form>
      {isWriting && (
        <div>
          <p>Writing</p>
          <div className="indeterminate-progress-bar">
            <div className="indeterminate-progress-bar__progress"></div>
          </div>
        </div>
      )}
      {isReading && (
        <div>
          <p>Reading</p>
          <div className="indeterminate-progress-bar">
            <div className="indeterminate-progress-bar__progress"></div>
          </div>
        </div>
      )}
      {notes &&
        notes.map((note, i) => (
          <div key={`note-display-${i}`}>
            <div
              style={{ backgroundColor: note?.color }}
              className="note-color"
            ></div>
            <div>{note?.text}</div>
          </div>
        ))}
    </div>
  );
}

export default App;
