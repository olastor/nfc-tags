import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const COLORS = {
  red: '#cc3300',
  orange: '#ff9966',
  yellow: '#ffcc00',
  'light green': '#99cc33',
  green: '#339900',
  blue: '#BFD7EA',
};

const RE_TEXT = new RegExp(`^(.+)(\\((${Object.keys(COLORS).join('|')})\\))$`);

const formatNote = (note) =>
  `${note.text}${note.color ? ` (${note.color})` : ''}`;
const parseNote = (rawText) => {
  const match = rawText.match(RE_TEXT);
  if (!match) return { color: '', text: rawText };
  return { color: match[3], text: match[1] };
};

let writeAbortController;
let readAbortController;

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
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
      if (!chosenText) return;
      setNotes((prevNotes) => [
        ...prevNotes,
        { color: selectedColor, text: chosenText },
      ]);
      setChosenText('');
    },
    [notes, setNotes, chosenText, setChosenText, selectedColor]
  );

  const deleteNote = useCallback(
    (i) => {
      setNotes((prevNotes) => [...prevNotes.filter((_, j) => i !== j)]);
    },
    [notes, setNotes]
  );

  const readTag = useCallback(async () => {
    try {
      const ndef = new window.NDEFReader();
      setIsReading(true);
      await ndef.scan({ signal: readAbortController.signal });
      setNotes([]);

      ndef.addEventListener('readingerror', () => {
        console.log('error');
      });

      let firstRead = false;
      ndef.addEventListener('reading', ({ message, serialNumber }) => {
        if (!firstRead) {
          setTimeout(() => {
            readAbortController.abort();
            readAbortController = new AbortController();
          }, 3000);
          firstRead = true;
        }
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
      <form onSubmit={addNote}>
        <div className="color-select">
          {Object.keys(COLORS).map((color) => (
            <div
              key={`color-pick-${color}`}
              onClick={() => setSelectedColor(color)}
              style={{ backgroundColor: COLORS[color] }}
              className={`predefined-color${
                color === selectedColor ? ' selected-color' : ''
              }`}
            ></div>
          ))}
        </div>
        <input
          value={chosenText}
          type="text"
          onChange={(e) => setChosenText(e.target.value)}
        />
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
            {note.color && (
              <div
                style={{ backgroundColor: COLORS[note?.color] }}
                className="note-color"
              ></div>
            )}
            <div>{note?.text}</div>
            <button onClick={() => deleteNote(i)}>delete</button>
          </div>
        ))}
      <div>
        <button
          disabled={isReading || isWriting || !notes || !notes.length}
          onClick={() => readTag()}
        >
          Read
        </button>
        <button
          disabled={isReading || isWriting || !notes || !notes.length}
          onClick={() => writeTag()}
        >
          Write
        </button>
      </div>
    </div>
  );
}

export default App;
