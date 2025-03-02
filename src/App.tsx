import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { MAX_POINTS, ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST, API_URL } from "./consts";

// Type Definitions
interface CharacterType {
  attributes: Record<string, number>;
  skills: Record<string, number>;
  selectedClass: string | null;
  skillCheck: { skill: string; DC: number; result: { roll: number; success: boolean } | null };
}

interface CharacterProps {
  character: CharacterType;
  updateCharacter: (updated: CharacterType) => void;
}

function Character({ character, updateCharacter }: CharacterProps) {
  const modifyAttribute = (attr: string, delta: number) => {
    const totalPoints = Object.values(character.attributes).reduce((sum, val) => sum + val, 0);
    if (totalPoints + delta > MAX_POINTS || character.attributes[attr] + delta < 0) return;
    
    const updatedAttributes = {
      ...character.attributes,
      [attr]: character.attributes[attr] + delta,
    };
    updateCharacter({ ...character, attributes: updatedAttributes });
  };

  return (
    <div className="character-card">
      <h3>Character</h3>
      {ATTRIBUTE_LIST.map((attr) => (
        <div key={attr} className="attribute-row">
          <span>
            {attr}: {character.attributes[attr]} (Modifier: {Math.floor((character.attributes[attr] - 10) / 2)})
          </span>
          <button onClick={() => modifyAttribute(attr, -1)} className="btn">-</button>
          <button onClick={() => modifyAttribute(attr, 1)} className="btn btn-primary">+</button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  
  useEffect(() => {
    axios.get(API_URL).then((response) => {
      if (Array.isArray(response.data.body)) {
        setCharacters(response.data.body.map(validateCharacter));
      } else {
        setCharacters([]);
      }
    }).catch(() => setCharacters([]));
  }, []);

  const addCharacter = () => {
    setCharacters([...characters, createNewCharacter()]);
  };

  const updateCharacter = (index: number, updatedCharacter: CharacterType) => {
    const newCharacters = [...characters];
    newCharacters[index] = updatedCharacter;
    setCharacters(newCharacters);
  };

  const saveCharacters = () => {
    axios.post(API_URL, characters, { headers: { "Content-Type": "application/json" } });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Coding Exercise - Vishal Sancheti</h1>
      </header>
      <section className="App-section">
        <button onClick={addCharacter} className="btn btn-add">Add Character</button>
        {Array.isArray(characters) && characters.length > 0 ? (
          characters.map((character, index) => (
            <Character key={index} character={character} updateCharacter={(updated) => updateCharacter(index, updated)} />
          ))
        ) : (
          <p>No characters available.</p>
        )}
        <button onClick={saveCharacters} className="btn btn-save">Save Characters</button>
      </section>
    </div>
  );
}

function createNewCharacter(): CharacterType {
  return {
    attributes: ATTRIBUTE_LIST.reduce((acc, attr) => ({ ...acc, [attr]: 10 }), {} as Record<string, number>),
    skills: SKILL_LIST.reduce((acc, skill) => ({ ...acc, [skill.name]: 0 }), {} as Record<string, number>),
    selectedClass: null,
    skillCheck: { skill: SKILL_LIST[0].name, DC: 10, result: null },
  };
}

function validateCharacter(data: any): CharacterType {
  return {
    attributes: ATTRIBUTE_LIST.reduce((acc, attr) => ({
      ...acc,
      [attr]: typeof data.attributes?.[attr] === 'number' ? data.attributes[attr] : 10
    }), {} as Record<string, number>),
    skills: SKILL_LIST.reduce((acc, skill) => ({
      ...acc,
      [skill.name]: typeof data.skills?.[skill.name] === 'number' ? data.skills[skill.name] : 0
    }), {} as Record<string, number>),
    selectedClass: typeof data.selectedClass === 'string' ? data.selectedClass : null,
    skillCheck: {
      skill: typeof data.skillCheck?.skill === 'string' ? data.skillCheck.skill : SKILL_LIST[0].name,
      DC: typeof data.skillCheck?.DC === 'number' ? data.skillCheck.DC : 10,
      result: data.skillCheck?.result && typeof data.skillCheck.result.roll === 'number' && typeof data.skillCheck.result.success === 'boolean'
        ? data.skillCheck.result
        : null
    }
  };
}
