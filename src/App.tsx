import React, { useState } from 'react';
import { PKD_CODES } from './config/pkdCodes';
import './App.css';

interface FormData {
  rodzajDzialalnosci: string;
  pkdCode: string;
  postalCode: string;
  politicalConnections: boolean;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    rodzajDzialalnosci: '',
    pkdCode: '',
    postalCode: '',
    politicalConnections: false,
  });
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper function to convert URLs in text to clickable links
  const convertLinksToHTML = (text: string): string => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/.netlify/functions/generate-project-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd podczas przetwarzania żądania');
      }

      if (data.limitExceeded) {
        setError(data.message || 'Przekroczono limit 10 żądań dziennie. Spróbuj ponownie jutro.');
      } else {
        setResult(data.projectName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Generator Nazw Projektów KPO</h1>
        <p className="subtitle">
          Wygeneruj profesjonalną nazwę projektu modernizacji działalności w ramach Krajowego Planu Odbudowy
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="rodzajDzialalnosci">Rodzaj działalności:</label>
            <input
              type="text"
              id="rodzajDzialalnosci"
              name="rodzajDzialalnosci"
              value={formData.rodzajDzialalnosci}
              onChange={handleInputChange}
              required
              placeholder="np. produkcja mebli, usługi IT, handel detaliczny"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pkdCode">Grupa PKD:</label>
            <select
              id="pkdCode"
              name="pkdCode"
              value={formData.pkdCode}
              onChange={handleInputChange}
              required
            >
              <option value="">Wybierz kod PKD</option>
              {PKD_CODES.map((pkd) => (
                <option key={pkd.code} value={pkd.code}>
                  {pkd.code} - {pkd.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="postalCode">Kod pocztowy:</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              required
              pattern="[0-9]{2}-[0-9]{3}"
              placeholder="00-000"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="politicalConnections"
                checked={formData.politicalConnections}
                onChange={handleInputChange}
              />
              Czy masz koneksje polityczne?
            </label>
          </div>

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Generowanie...' : 'Wygeneruj nazwę projektu'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <h3>Błąd:</h3>
            <p dangerouslySetInnerHTML={{ __html: convertLinksToHTML(error.replace(/\n/g, '<br>')) }}></p>
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Wygenerowana nazwa projektu:</h3>
            <div className="project-name">
              {result.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
